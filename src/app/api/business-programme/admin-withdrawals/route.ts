import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner } from "@/lib/marketingPartner";
import { isWalletLedgerEnabled } from "@/lib/businessProgrammeWallet";

async function getAdmin(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user?.email) return null;
  const allowed = (process.env.BUSINESS_PROGRAMME_ADMIN_EMAILS || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(data.user.email.toLowerCase())) return null;
  return { admin, user: data.user };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdmin(req);
    if (!auth) return NextResponse.json({ error: "Admin access is not configured or you are not authorised." }, { status: 403 });
    const users: any[] = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await auth.admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const requests = users.flatMap((user) => {
      const partner = getPartner(user);
      if (!partner) return [];
      return (Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [])
        .filter((entry) => entry.status === "withdrawal:pending")
        .map((entry) => ({
          userId: user.id,
          email: user.email || "",
          name: partner.businessName || user.user_metadata?.full_name || user.user_metadata?.name || "Partner",
          mobile: partner.mobile || "",
          amount: Number(entry.amount) || 0,
          requestedAt: entry.requestedAt,
          walletBalance: Number(partner.walletBalance) || 0,
          status: entry.status,
          ...((entry as typeof entry & { referenceId?: string }).referenceId
            ? { referenceId: (entry as typeof entry & { referenceId?: string }).referenceId }
            : {}),
        }));
    });
    if (isWalletLedgerEnabled) {
      // Include ledger-pending withdrawals even if the Auth metadata write failed
      // after reserving funds. This keeps orphaned requests visible to admins.
      const ledgerRequests: Array<{
        partner_user_id: string;
        amount_inr: number;
        reference_id: string;
        created_at: string;
        metadata: Record<string, unknown> | null;
      }> = [];
      for (let offset = 0; ; offset += 1000) {
        const { data: page, error: ledgerError } = await auth.admin
          .from("business_programme_wallet_transactions")
          .select("partner_user_id, amount_inr, reference_id, created_at, metadata")
          .eq("transaction_type", "withdrawal_request")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .range(offset, offset + 999);
        if (ledgerError) throw ledgerError;
        ledgerRequests.push(...(page || []));
        if (!page || page.length < 1000) break;
      }
      const decisions: Array<{ partner_user_id: string; reference_id: string }> = [];
      for (let offset = 0; ; offset += 1000) {
        const { data: page, error: decisionsError } = await auth.admin
          .from("business_programme_withdrawal_decisions")
          .select("partner_user_id, reference_id")
          .range(offset, offset + 999);
        if (decisionsError) throw decisionsError;
        decisions.push(...(page || []));
        if (!page || page.length < 1000) break;
      }
      const decidedKeys = new Set(decisions.map((item) => `${item.partner_user_id}|${item.reference_id}`));
      const userMap = new Map(users.map((user) => [user.id, user]));
      for (const item of ledgerRequests || []) {
        if (decidedKeys.has(`${item.partner_user_id}|${item.reference_id}`)) continue;
        const user = userMap.get(item.partner_user_id);
        if (!user) continue;
        const partner = getPartner(user);
        const requestedAt = String(item.created_at || item.metadata?.requestedAt || "");
        const alreadyVisible = requests.some((request) => {
          if (request.userId !== item.partner_user_id) return false;
          const visibleReferenceId = (request as typeof request & { referenceId?: string }).referenceId;
          if (visibleReferenceId && item.reference_id) return visibleReferenceId === item.reference_id;
          // Legacy metadata entries may not have a reference ID. Fall back to
          // timestamp plus amount so simultaneous requests aren't accidentally merged.
          return Number(request.amount) === Number(item.amount_inr) &&
            (request.requestedAt === requestedAt || request.requestedAt === item.metadata?.requestedAt);
        });
        if (alreadyVisible) continue;
        requests.push({
          userId: item.partner_user_id,
          email: user.email || "",
          name: partner?.businessName || user.user_metadata?.full_name || user.user_metadata?.name || "Partner",
          mobile: partner?.mobile || "",
          amount: Number(item.amount_inr) || 0,
          requestedAt,
          walletBalance: Number(partner?.walletBalance) || 0,
          status: "withdrawal:pending",
          referenceId: item.reference_id,
        } as typeof requests[number] & { referenceId: string });
      }

      const partnerIds = [...new Set(requests.map((request) => request.userId))];
      if (partnerIds.length > 0) {
        const { data: accounts, error: accountsError } = await auth.admin
          .from("business_programme_wallet_accounts")
          .select("partner_user_id, balance_inr")
          .in("partner_user_id", partnerIds);
        if (accountsError) throw accountsError;
        const balances = new Map((accounts || []).map((account) => [account.partner_user_id, Number(account.balance_inr) || 0]));
        for (const request of requests) {
          if (balances.has(request.userId)) request.walletBalance = balances.get(request.userId)!;
        }
      }
    }
    if (isWalletLedgerEnabled) {
      // Keep approved-but-unpaid withdrawals visible so the admin can record the
      // external transfer after it has actually settled.
      const allDecisions: Array<{ partner_user_id: string; reference_id: string; decision: string }> = [];
      for (let offset = 0; ; offset += 1000) {
        const { data: page, error: pageError } = await auth.admin
          .from("business_programme_withdrawal_decisions")
          .select("partner_user_id, reference_id, decision")
          .eq("decision", "approve")
          .range(offset, offset + 999);
        if (pageError) throw pageError;
        allDecisions.push(...(page || []));
        if (!page || page.length < 1000) break;
      }
      const approvedKeys = new Set(allDecisions.map((item) => `${item.partner_user_id}|${item.reference_id}`));
      const paidKeys = new Set<string>();
      for (let offset = 0; ; offset += 1000) {
        const { data: page, error: pageError } = await auth.admin
          .from("business_programme_wallet_transactions")
          .select("partner_user_id, reference_id")
          .eq("transaction_type", "withdrawal_paid")
          .range(offset, offset + 999);
        if (pageError) throw pageError;
        for (const item of page || []) paidKeys.add(`${item.partner_user_id}|${item.reference_id}`);
        if (!page || page.length < 1000) break;
      }
      const approvedRows: Array<{ partner_user_id: string; amount_inr: number; reference_id: string; created_at: string }> = [];
      for (let offset = 0; ; offset += 1000) {
        const { data: page, error: pageError } = await auth.admin
          .from("business_programme_wallet_transactions")
          .select("partner_user_id, amount_inr, reference_id, created_at")
          .eq("transaction_type", "withdrawal_approved")
          .order("created_at", { ascending: true })
          .range(offset, offset + 999);
        if (pageError) throw pageError;
        approvedRows.push(...(page || []));
        if (!page || page.length < 1000) break;
      }
      const userMap = new Map(users.map((user) => [user.id, user]));
      const existingRequestKeys = new Set(requests.map((request) =>
        `${request.userId}|${(request as typeof request & { referenceId?: string }).referenceId || ""}`
      ));
      for (const item of approvedRows) {
        const key = `${item.partner_user_id}|${item.reference_id}`;
        if (!approvedKeys.has(key) || paidKeys.has(key) || existingRequestKeys.has(key)) continue;
        const user = userMap.get(item.partner_user_id);
        if (!user) continue;
        const partner = getPartner(user);
        const { data: account, error: accountError } = await auth.admin
          .from("business_programme_wallet_accounts")
          .select("balance_inr")
          .eq("partner_user_id", item.partner_user_id)
          .maybeSingle();
        if (accountError) throw accountError;
        requests.push({
          userId: item.partner_user_id,
          email: user.email || "",
          name: partner?.businessName || user.user_metadata?.full_name || user.user_metadata?.name || "Partner",
          mobile: partner?.mobile || "",
          amount: Number(item.amount_inr) || 0,
          requestedAt: String(item.created_at || ""),
          walletBalance: Number(account?.balance_inr ?? partner?.walletBalance) || 0,
          status: "withdrawal:approved_unpaid",
          referenceId: item.reference_id,
        } as typeof requests[number] & { referenceId: string });
      }
    }
    requests.sort((a, b) => String(a.requestedAt).localeCompare(String(b.requestedAt)));
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Could not load withdrawal requests." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAdmin(req);
    if (!auth) return NextResponse.json({ error: "Admin access is not configured or you are not authorised." }, { status: 403 });
    const body = await req.json();
    const userId = String(body.userId || "");
    const requestedAt = String(body.requestedAt || "");
    const suppliedReferenceId = typeof body.referenceId === "string" ? body.referenceId : "";
    const decision = String(body.decision || "");
    if (!userId || (!requestedAt && !suppliedReferenceId) || !["approve", "reject", "mark_paid"].includes(decision)) {
      return NextResponse.json({ error: "Invalid withdrawal decision." }, { status: 400 });
    }

    const { data, error } = await auth.admin.auth.admin.getUserById(userId);
    if (error || !data.user) return NextResponse.json({ error: "Partner account not found." }, { status: 404 });
    const partner = getPartner(data.user);
    if (!partner) return NextResponse.json({ error: "Partner account not found." }, { status: 404 });
    const entries = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];
    if (decision === "mark_paid") {
      if (!isWalletLedgerEnabled) {
        return NextResponse.json({ error: "Payout recording requires the wallet ledger to be enabled." }, { status: 503 });
      }
      const payoutReference = String(body.payoutReference || "").trim();
      if (!suppliedReferenceId || !payoutReference || payoutReference.length > 160) {
        return NextResponse.json({ error: "A withdrawal reference and completed bank payout reference are required." }, { status: 400 });
      }
      const { data: approvedTransaction, error: approvedError } = await auth.admin
        .from("business_programme_wallet_transactions")
        .select("amount_inr, created_at")
        .eq("partner_user_id", userId)
        .eq("reference_id", suppliedReferenceId)
        .eq("transaction_type", "withdrawal_approved")
        .maybeSingle();
      if (approvedError) throw approvedError;
      if (!approvedTransaction) return NextResponse.json({ error: "Only an approved withdrawal can be marked paid." }, { status: 409 });

      const { data: payoutResult, error: payoutError } = await auth.admin.rpc("business_programme_withdrawal_mark_paid", {
        p_partner_user_id: userId,
        p_reference_id: suppliedReferenceId,
        p_amount_inr: Number(approvedTransaction.amount_inr),
        p_payout_reference: payoutReference,
        p_paid_by: auth.user.id,
      });
      if (payoutError) throw payoutError;
      const payout = payoutResult as { success?: boolean; duplicate?: boolean; error?: string } | null;
      if (!payout?.success) {
        if (payout?.error === "PAYOUT_ALREADY_RECORDED") {
          return NextResponse.json({ error: "A payout is already recorded for this withdrawal with a different amount or reference." }, { status: 409 });
        }
        return NextResponse.json({ error: payout?.error || "Could not record completed payout." }, { status: 409 });
      }

      const paidAt = new Date().toISOString();
      const prior = entries.find((entry) => (entry as typeof entry & { referenceId?: string }).referenceId === suppliedReferenceId);
      const paidEntry = {
        amount: Number(approvedTransaction.amount_inr) || 0,
        status: "withdrawal:paid",
        requestedAt: prior?.requestedAt || String(approvedTransaction.created_at || paidAt),
        referenceId: suppliedReferenceId,
        payoutReference,
        paidAt,
      };
      const nextEntries = [paidEntry, ...entries.filter((entry) =>
        (entry as typeof entry & { referenceId?: string }).referenceId !== suppliedReferenceId
      )].slice(0, 100);
      const { error: metadataError } = await auth.admin.auth.admin.updateUserById(userId, {
        app_metadata: { ...data.user.app_metadata, marketing_partner: { ...partner, withdrawalRequests: nextEntries } },
      });
      if (metadataError) console.error("Payout recorded in ledger but partner metadata sync failed:", metadataError);
      return NextResponse.json({
        success: true,
        duplicate: Boolean(payout.duplicate),
        message: payout.duplicate ? "This payout was already recorded." : "Completed bank payout recorded successfully.",
      });
    }

    let index = entries.findIndex((entry) =>
      entry.status === "withdrawal:pending" &&
      (entry.requestedAt === requestedAt ||
        (suppliedReferenceId && (entry as typeof entry & { referenceId?: string }).referenceId === suppliedReferenceId))
    );
    if (index < 0) {
      // A previous decision may have reached the ledger but failed while
      // updating Auth metadata. If the same decision is already reflected in
      // metadata, make retries safe and return an idempotent success.
      const completed = entries.find((entry) => {
        const entryReferenceId = (entry as typeof entry & { referenceId?: unknown }).referenceId;
        const sameRequest = suppliedReferenceId
          ? entryReferenceId === suppliedReferenceId
          : Boolean(requestedAt) && entry.requestedAt === requestedAt;
        return sameRequest &&
          entry.status === (decision === "approve" ? "withdrawal:approved" : "withdrawal:rejected");
      });
      if (completed) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: decision === "approve"
            ? "This withdrawal was already approved. Complete or verify the external bank transfer separately."
            : "This withdrawal was already rejected.",
        });
      }
    }

    // Recover metadata when the database decision committed but the Auth metadata
    // write failed. A decided request is no longer in the pending-ledger query,
    // so retries must reconcile from the canonical decision and ledger records.
    if (index < 0 && isWalletLedgerEnabled && suppliedReferenceId) {
      const [{ data: recordedDecision, error: recordedDecisionError }, { data: recordedTransaction, error: recordedTransactionError }] = await Promise.all([
        auth.admin
          .from("business_programme_withdrawal_decisions")
          .select("decision")
          .eq("partner_user_id", userId)
          .eq("reference_id", suppliedReferenceId)
          .maybeSingle(),
        auth.admin
          .from("business_programme_wallet_transactions")
          .select("amount_inr, created_at")
          .eq("partner_user_id", userId)
          .eq("reference_id", suppliedReferenceId)
          .eq("transaction_type", decision === "approve" ? "withdrawal_approved" : "withdrawal_rejected")
          .maybeSingle(),
      ]);
      if (recordedDecisionError) throw recordedDecisionError;
      if (recordedTransactionError) throw recordedTransactionError;
      if (recordedDecision && recordedTransaction && recordedDecision.decision === decision) {
        const reconciledAt = String(recordedTransaction.created_at || requestedAt || new Date().toISOString());
        const reconciledEntry = {
          amount: Number(recordedTransaction.amount_inr) || 0,
          status: decision === "approve" ? "withdrawal:approved" : "withdrawal:rejected",
          requestedAt: requestedAt || reconciledAt,
          referenceId: suppliedReferenceId,
        };
        const reconciledEntries = [reconciledEntry, ...entries.filter((entry) =>
          (entry as typeof entry & { referenceId?: string }).referenceId !== suppliedReferenceId
        )].slice(0, 100);
        let reconciledBalance = Math.max(0, Number(partner.walletBalance || 0));
        const { data: walletAccount, error: walletAccountError } = await auth.admin
          .from("business_programme_wallet_accounts")
          .select("balance_inr")
          .eq("partner_user_id", userId)
          .maybeSingle();
        if (walletAccountError) throw walletAccountError;
        if (walletAccount) reconciledBalance = Number(walletAccount.balance_inr) || 0;
        const { error: reconcileError } = await auth.admin.auth.admin.updateUserById(userId, {
          app_metadata: {
            ...data.user.app_metadata,
            marketing_partner: {
              ...partner,
              walletBalance: reconciledBalance,
              withdrawalRequests: reconciledEntries,
            },
          },
        });
        if (reconcileError) throw reconcileError;
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: decision === "approve"
            ? "Withdrawal approval was already recorded. External bank transfer must be verified separately."
            : "Withdrawal rejection was already recorded and the wallet metadata has been reconciled.",
        });
      }
    }

    let request: { amount: number; status: string; requestedAt: string; referenceId?: string } | undefined =
      index >= 0 ? { ...entries[index] } : undefined;
    let requestReferenceId = request && (request as typeof request & { referenceId?: unknown }).referenceId;
    let referenceId = typeof requestReferenceId === "string"
      ? requestReferenceId
      : suppliedReferenceId || `withdrawal:${userId}:${requestedAt}`;

    // Admin can act on a ledger-only request that was not saved to Auth metadata.
    if (!request && isWalletLedgerEnabled && suppliedReferenceId) {
      const { data: ledgerRequest, error: ledgerRequestError } = await auth.admin
        .from("business_programme_wallet_transactions")
        .select("amount_inr, reference_id, created_at, metadata")
        .eq("partner_user_id", userId)
        .eq("transaction_type", "withdrawal_request")
        .eq("reference_id", suppliedReferenceId)
        .eq("status", "pending")
        .maybeSingle();
      if (ledgerRequestError) throw ledgerRequestError;
      if (!ledgerRequest) return NextResponse.json({ error: "This withdrawal was already handled or could not be found." }, { status: 409 });
      request = {
        amount: Number(ledgerRequest.amount_inr),
        status: "withdrawal:pending",
        requestedAt: String(ledgerRequest.created_at || requestedAt || ledgerRequest.metadata?.requestedAt || ""),
        referenceId: ledgerRequest.reference_id,
      };
      index = entries.length;
    }
    if (!request) return NextResponse.json({ error: "This request was already handled or could not be found." }, { status: 409 });
    let nextBalance = Math.max(0, Number(partner.walletBalance || 0)) +
      (decision === "reject" ? Math.max(0, Number(request.amount || 0)) : 0);
    if (isWalletLedgerEnabled) {
      // The database RPC locks the wallet and atomically records the decision
      // and its corresponding ledger transaction, including recovery retries.
      const { data: result, error: decisionError } = await auth.admin.rpc("business_programme_withdrawal_decide_and_post", {
        p_partner_user_id: userId,
        p_reference_id: referenceId,
        p_decision: decision,
        p_amount_inr: Number(request.amount || 0),
        p_decided_by: auth.user.id,
        p_requested_at: requestedAt || request.requestedAt,
      });
      if (decisionError) throw decisionError;
      const decisionResult = result as { success?: boolean; conflict?: boolean; decision?: string; duplicate?: boolean; balance?: number; error?: string } | null;
      if (decisionResult?.conflict) {
        return NextResponse.json({
          error: `This withdrawal was already recorded as ${decisionResult.decision}.`,
        }, { status: 409 });
      }
      if (!decisionResult?.success) {
        throw new Error(decisionResult?.error || "Could not atomically record withdrawal decision.");
      }
      nextBalance = Number(decisionResult.balance ?? nextBalance);
    }
    const nextEntries = [...entries];
    nextEntries[index] = { ...request, status: decision === "approve" ? "withdrawal:approved" : "withdrawal:rejected" };
    const nextPartner = {
      ...partner,
      walletBalance: nextBalance,
      withdrawalRequests: nextEntries,
    };
    const { error: updateError } = await auth.admin.auth.admin.updateUserById(userId, {
      app_metadata: { ...data.user.app_metadata, marketing_partner: nextPartner },
    });
    if (updateError) throw updateError;
    return NextResponse.json({ success: true, message: decision === "approve" ? "Withdrawal marked approved. Complete the bank transfer and record the payout reference separately." : "Withdrawal rejected and reserved balance returned to the partner." });
  } catch {
    return NextResponse.json({ error: "Could not process this withdrawal decision." }, { status: 500 });
  }
}
