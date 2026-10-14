import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner } from "@/lib/marketingPartner";
import { isWalletLedgerEnabled } from "@/lib/businessProgrammeWallet";

export async function GET(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please log in to view your partner dashboard." }, { status: 401 });

    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });

    const partner = getPartner(data.user);
    if (!partner) return NextResponse.json({ error: "No business programme application was found for this account." }, { status: 404 });

    const entries = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];
    let walletBalance = Math.max(0, Number(partner.walletBalance || 0));
    let history = entries.slice(0, 100).map((entry) => {
      const status = String(entry.status || "recorded");
      const rawAmount = Number(entry.amount) || 0;
      const amount = status === "withdrawal:pending"
        ? -Math.abs(rawAmount)
        : status === "withdrawal:rejected"
          ? Math.abs(rawAmount)
          : status === "withdrawal:approved" || status === "withdrawal:paid"
            ? 0
            : rawAmount;
      return {
        amount,
        status,
        requestedAt: entry.requestedAt || null,
        kind: status.startsWith("reward:") ? "reward" : "withdrawal",
      };
    });

    if (isWalletLedgerEnabled) {
      const { data: account, error: accountError } = await admin
        .from("business_programme_wallet_accounts")
        .select("balance_inr")
        .eq("partner_user_id", data.user.id)
        .maybeSingle();
      if (accountError) throw accountError;
      if (account) walletBalance = Math.max(0, Number(account.balance_inr || 0));

      const { data: transactions, error: transactionsError } = await admin
        .from("business_programme_wallet_transactions")
        .select("amount_inr, transaction_type, status, created_at, reference_id, description, metadata")
        .eq("partner_user_id", data.user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (transactionsError) throw transactionsError;
      history = (transactions || []).map((entry) => {
        const type = String(entry.transaction_type || "");
        const rawAmount = Number(entry.amount_inr) || 0;
        // Show the wallet impact, not a positive-looking amount for an event
        // that merely records approval or payout of funds already reserved.
        const amount = type === "reward_reversal" || type === "withdrawal_request" || type === "wallet_spend"
          ? -Math.abs(rawAmount)
          : type === "withdrawal_rejected" || type === "wallet_refund" || type === "reward"
            ? Math.abs(rawAmount)
            : type === "withdrawal_approved" || type === "withdrawal_paid"
              ? 0
              : rawAmount;
        return {
          amount,
          status: type === "reward_reversal"
            ? "Reward reversed · " + String(entry.metadata?.orderNumber || entry.reference_id || "")
            : String(entry.status || type || "recorded"),
          requestedAt: entry.created_at || null,
          kind: type === "reward_reversal"
            ? "reward reversal"
            : type.replace(/_/g, " ") || "activity",
        };
      });

      // Metadata may lag if a reward was committed to the ledger but the
      // subsequent Auth metadata write failed. Use ledger aggregates as a
      // lower bound while preserving older legacy totals not represented in
      // the ledger migration.
      const rewardRows: Array<{ amount_inr: number; metadata: Record<string, unknown> | null; created_at: string }> = [];
      for (let offset = 0; ; offset += 1000) {
        const { data: page, error: rewardRowsError } = await admin
          .from("business_programme_wallet_transactions")
          .select("amount_inr, metadata, created_at")
          .eq("partner_user_id", data.user.id)
          .eq("transaction_type", "reward")
          .order("created_at", { ascending: false })
          .range(offset, offset + 999);
        if (rewardRowsError) throw rewardRowsError;
        rewardRows.push(...(page || []));
        if (!page || page.length < 1000) break;
      }
      const ledgerLifetimeRewards = (rewardRows || []).reduce((sum, row) => sum + Math.max(0, Number(row.amount_inr) || 0), 0);
      const ledgerLifetimeSales = (rewardRows || []).reduce((sum, row) => {
        const billed = Number(row.metadata?.billedAmountInr);
        return sum + (Number.isFinite(billed) ? Math.max(0, billed) : 0);
      }, 0);
      // Read canonical reward state before computing the qualification window.
      // Auth metadata can lag after a successful atomic reward credit.
      const { data: rewardState, error: rewardStateError } = await admin
        .from("business_programme_partner_reward_state")
        .select("reward_tier, qualification_coins, qualification_period_started_at, lifetime_rewards, total_sales, referred_orders, coupon_usage_count")
        .eq("partner_user_id", data.user.id)
        .maybeSingle();
      if (rewardStateError) throw rewardStateError;
      const canonicalPeriodStart = rewardState?.qualification_period_started_at || partner.qualificationPeriodStartedAt;
      const periodStart = canonicalPeriodStart ? new Date(canonicalPeriodStart) : null;
      const now = Date.now();
      const periodStartMs = periodStart?.getTime() ?? Number.NaN;
      const elapsedSincePeriodStart = now - periodStartMs;
      const qualificationWindowValid = Boolean(periodStart && Number.isFinite(periodStartMs) && elapsedSincePeriodStart >= 0 && elapsedSincePeriodStart < 30 * 24 * 60 * 60 * 1000);
      const ledgerWindowCoins = (rewardRows || []).reduce((sum, row) => {
        const createdAt = new Date(row.created_at).getTime();
        return sum + (qualificationWindowValid && Number.isFinite(createdAt) && createdAt >= periodStart!.getTime()
          ? Math.max(0, Number(row.amount_inr) || 0)
          : 0);
      }, 0);
      partner.totalRewards = Math.max(0, Number(partner.totalRewards) || 0, ledgerLifetimeRewards);
      partner.totalSales = Math.max(0, Number(partner.totalSales) || 0, ledgerLifetimeSales);
      if (qualificationWindowValid) partner.qualificationCoins = Math.max(0, Number(partner.qualificationCoins) || 0, ledgerWindowCoins);

      // The atomic reward-state row is authoritative for tier/counters because
      // Auth metadata updates can race when separate orders complete together.
      if (rewardState) {
        partner.rewardTier = rewardState.reward_tier as "basic" | "silver" | "gold";
        // Qualification coins expire after 30 days; the tier itself remains permanent.
        // The next reward credit will persist the next qualification period atomically.
        partner.qualificationCoins = qualificationWindowValid
          ? Math.max(0, Number(rewardState.qualification_coins) || 0)
          : 0;
        partner.qualificationPeriodStartedAt = qualificationWindowValid
          ? rewardState.qualification_period_started_at || undefined
          : undefined;
        partner.totalRewards = Number(rewardState.lifetime_rewards) || 0;
        partner.totalSales = Number(rewardState.total_sales) || 0;
        partner.referredCustomers = Number(rewardState.referred_orders) || 0;
        partner.usageCount = Number(rewardState.coupon_usage_count) || 0;
      }
    }

    return NextResponse.json({
      status: partner.status,
      userId: data.user.id,
      code: partner.code || null,
      rewardTier: partner.rewardTier || "basic",
      rewardRate: partner.rewardTier === "gold" ? 30 : partner.rewardTier === "silver" ? 27 : 25,
      walletBalance,
      lifetimeCoins: Math.max(0, Number(partner.totalRewards || 0)),
      qualificationCoins: Math.max(0, Number(partner.qualificationCoins || 0)),
      qualificationPeriodStartedAt: partner.qualificationPeriodStartedAt || null,
      totalSales: Math.max(0, Number(partner.totalSales || 0)),
      referredCustomers: Math.max(0, Number(partner.referredCustomers || 0)),
      history,
    });
  } catch {
    return NextResponse.json({ error: "Could not load your partner dashboard right now." }, { status: 500 });
  }
}
