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
    let history = entries.slice(0, 100).map((entry) => ({
      amount: Number(entry.amount) || 0,
      status: String(entry.status || "recorded"),
      requestedAt: entry.requestedAt || null,
      kind: String(entry.status || "").startsWith("reward:") ? "reward" : "withdrawal",
    }));

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
      history = (transactions || []).map((entry) => ({
        amount: Number(entry.amount_inr) || 0,
        status: String(entry.status || entry.transaction_type || "recorded"),
        requestedAt: entry.created_at || null,
        kind: entry.transaction_type,
      }));

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
      const periodStart = partner.qualificationPeriodStartedAt ? new Date(partner.qualificationPeriodStartedAt) : null;
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
