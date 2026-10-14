import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner, PARTNER_MIN_WITHDRAWAL } from "@/lib/marketingPartner";
import { isWalletLedgerEnabled, postWalletTransaction } from "@/lib/businessProgrammeWallet";

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Math.floor(Number(body.amount));
    if (!Number.isFinite(amount) || amount < PARTNER_MIN_WITHDRAWAL) {
      return NextResponse.json({ error: "The minimum withdrawal request is ₹1,000." }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });

    const { data: latest, error: latestError } = await admin.auth.admin.getUserById(data.user.id);
    if (latestError || !latest.user) return NextResponse.json({ error: "Could not load your partner account." }, { status: 500 });
    const partner = getPartner(latest.user);
    if (!partner || partner.status !== "approved" || !partner.code) {
      return NextResponse.json({ error: "Only approved partners can request withdrawals." }, { status: 403 });
    }

    let balance = Math.max(0, Number(partner.walletBalance || 0));
    if (isWalletLedgerEnabled) {
      const { data: walletAccount, error: walletAccountError } = await admin
        .from("business_programme_wallet_accounts")
        .select("balance_inr")
        .eq("partner_user_id", data.user.id)
        .maybeSingle();
      if (walletAccountError) throw walletAccountError;
      if (walletAccount) balance = Math.max(0, Number(walletAccount.balance_inr || 0));
    }
    if (amount > balance) return NextResponse.json({ error: "The requested amount is higher than your available balance." }, { status: 400 });

    let entries = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];
    // First recover a request that was reserved in the ledger but whose Auth
    // metadata write failed. Only treat undecided ledger requests as pending.
    if (isWalletLedgerEnabled) {
      const { data: ledgerRequests, error: ledgerRequestsError } = await admin
        .from("business_programme_wallet_transactions")
        .select("amount_inr, reference_id, created_at, metadata")
        .eq("partner_user_id", data.user.id)
        .eq("transaction_type", "withdrawal_request")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(100);
      if (ledgerRequestsError) throw ledgerRequestsError;
      const { data: decisions, error: decisionsError } = await admin
        .from("business_programme_withdrawal_decisions")
        .select("reference_id")
        .eq("partner_user_id", data.user.id);
      if (decisionsError) throw decisionsError;
      const decidedReferences = new Set((decisions || []).map((item) => item.reference_id));
      const recoverable = (ledgerRequests || []).find((item) =>
        Number(item.amount_inr) === amount &&
        !decidedReferences.has(item.reference_id) &&
        !entries.some((entry) => (entry as typeof entry & { referenceId?: string }).referenceId === item.reference_id)
      );
      if (recoverable) {
        const requestedAt = recoverable.created_at || new Date().toISOString();
        const recoveredEntry = {
          amount: Number(recoverable.amount_inr),
          status: "withdrawal:pending",
          requestedAt,
          referenceId: recoverable.reference_id,
        };
        const recoveredPartner = {
          ...partner,
          walletBalance: balance,
          withdrawalRequests: [recoveredEntry, ...entries].slice(0, 100),
        };
        const { error: recoveryError } = await admin.auth.admin.updateUserById(data.user.id, {
          app_metadata: { ...latest.user.app_metadata, marketing_partner: recoveredPartner },
        });
        if (recoveryError) throw recoveryError;
        return NextResponse.json({
          success: true,
          walletBalance: balance,
          message: "Your existing withdrawal request was recovered and remains pending review.",
          duplicate: true,
        });
      }
    }

    // Avoid creating multiple reserved withdrawals when a partner retries the
    // same request while an earlier withdrawal is still awaiting admin review.
    const pendingRequest = entries.find((entry) => entry.status === "withdrawal:pending" && Number(entry.amount) === amount);
    if (pendingRequest) {
      return NextResponse.json({
        success: true,
        walletBalance: balance,
        message: "A withdrawal request for this amount is already pending review.",
        duplicate: true,
      });
    }
    const now = new Date().toISOString();
    const referenceId = `withdrawal:${data.user.id}:${now}`;
    let nextBalance = balance - amount;
    if (isWalletLedgerEnabled) {
      const wallet = await postWalletTransaction({
        partnerUserId: data.user.id,
        type: "withdrawal_request",
        amountInr: amount,
        referenceId,
        description: "Partner withdrawal request",
        metadata: { requestedAt: now },
      });
      // Even when the ledger transaction already exists, continue to reconcile
      // Auth metadata so a retry can repair a request whose first metadata update failed.
      nextBalance = Number(wallet.balance ?? nextBalance);
    }
    const next = {
      ...partner,
      walletBalance: nextBalance,
      withdrawalRequests: [{ amount, status: "withdrawal:pending", requestedAt: now, referenceId }, ...entries].slice(0, 100),
    };
    const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { ...latest.user.app_metadata, marketing_partner: next },
    });
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, walletBalance: next.walletBalance, message: "Withdrawal request submitted for review." });
  } catch {
    return NextResponse.json({ error: "Could not submit your withdrawal request right now." }, { status: 500 });
  }
}
