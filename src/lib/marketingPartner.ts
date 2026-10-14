import { supabaseAdmin } from "@/lib/supabase";
import { isWalletLedgerEnabled, postWalletTransaction } from "@/lib/businessProgrammeWallet";

export const PARTNER_REWARD_RATE = 0.25;
export const PARTNER_CUSTOMER_DISCOUNT_RATE = 0.10;
export const PARTNER_MAX_DISCOUNT_PER_UNIT = 0; // No per-unit cap on the approved 10% coupon discount.
export const PARTNER_CODE_VALIDITY_DAYS = 0; // Partner codes do not have a fixed expiry.
export const PARTNER_USAGE_LIMIT = Number.POSITIVE_INFINITY; // No fixed coupon-use cap.
export const PARTNER_MIN_WITHDRAWAL = 1000;

export interface MarketingPartner {
  status: "pending" | "approved" | "rejected";
  code?: string;
  expiresAt?: string;
  usageCount?: number;
  usageLimit?: number;
  walletBalance?: number;
  totalRewards?: number;
  /** Permanent reward tier: basic (25%), silver (27%), or gold (30%). */
  rewardTier?: "basic" | "silver" | "gold";
  /** Coins earned in the current 30-day qualification window; resets after 30 days. */
  qualificationCoins?: number;
  qualificationPeriodStartedAt?: string;
  totalSales?: number;
  referredCustomers?: number;
  businessName?: string;
  gstPan?: string;
  address?: string;
  mobile?: string;
  photoPaths?: string[];
  appliedAt?: string;
  withdrawalRequests?: { amount: number; status: string; requestedAt: string }[];
}

export function getPartner(user: { app_metadata?: Record<string, unknown> } | null): MarketingPartner | null {
  const value = user?.app_metadata?.marketing_partner;
  if (!value || typeof value !== "object") return null;
  return value as MarketingPartner;
}

export function partnerIsActive(partner: MarketingPartner | null) {
  if (!partner || partner.status !== "approved" || !partner.code) return false;
  // Existing codes with a legacy expiry still honour that expiry; new codes omit it.
  if (partner.expiresAt && new Date(partner.expiresAt).getTime() < Date.now()) return false;
  return (partner.usageCount ?? 0) < (partner.usageLimit ?? Number.POSITIVE_INFINITY);
}

export async function findPartnerByCode(code: string) {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const admin = supabaseAdmin();
  const perPage = 1000;

  // Supabase Auth only returns one page at a time. Search every page so active
  // partners are still discoverable after the account count exceeds 1,000.
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => {
      const partner = getPartner(candidate);
      return partnerIsActive(partner) && partner?.code?.toUpperCase() === clean;
    });
    if (user) return { user, partner: getPartner(user)! };
    if (data.users.length < perPage) return null;
  }
}

export function calculatePartnerDiscount(lines: { quantity: number; priceInr: number }[]) {
  return lines.reduce((sum, line) => {
    const perUnit = Math.round(Math.max(0, line.priceInr) * PARTNER_CUSTOMER_DISCOUNT_RATE);
    return sum + perUnit * Math.max(0, line.quantity);
  }, 0);
}

export async function creditPartnerReward(
  userId: string,
  partner: MarketingPartner,
  billedAmountInr: number,
  orderNumber: string,
) {
  const admin = supabaseAdmin();
  // Always reconcile against the latest Auth metadata, not the potentially stale
  // partner snapshot captured when the coupon was first looked up. Razorpay can
  // retry callbacks concurrently, so stale snapshots must not increment totals twice.
  const { data: currentData, error: currentError } = await admin.auth.admin.getUserById(userId);
  if (currentError || !currentData.user) throw currentError || new Error("Partner account not found.");
  const latestPartner = getPartner(currentData.user);
  if (!latestPartner) throw new Error("Partner account not found.");
  const existingOrders = Array.isArray(latestPartner.withdrawalRequests) ? latestPartner.withdrawalRequests : [];
  const alreadyCredited = existingOrders.some((entry) => entry.status === `reward:${orderNumber}` || entry.status.startsWith(`reward:${orderNumber}:`));
  if (alreadyCredited) return latestPartner;

  // When the canonical ledger is enabled, calculate and post the reward inside
  // one database transaction. This serializes concurrent orders for this partner.
  if (isWalletLedgerEnabled) {
    const { data: rpcData, error: rpcError } = await admin.rpc("business_programme_reward_credit", {
      p_partner_user_id: userId,
      p_order_number: orderNumber,
      p_billed_amount_inr: billedAmountInr,
    });
    if (rpcError) throw new Error(`Atomic partner reward failed: ${rpcError.message}`);
    const result = rpcData as {
      success?: boolean; duplicate?: boolean; error?: string; reward?: number; rewardRate?: number;
      rewardTier?: "basic" | "silver" | "gold"; rewardTierAfter?: "basic" | "silver" | "gold";
      balance?: number; qualificationCoins?: number; qualificationPeriodStartedAt?: string | null;
      totalRewards?: number; totalSales?: number; referredCustomers?: number; usageCount?: number;
    } | null;
    if (!result?.success) {
      if (result?.error === "ORDER_AMOUNT_MISMATCH") {
        throw new Error("This order reference was already credited with a different billed amount.");
      }
      if (result?.error === "REWARD_ROUNDS_TO_ZERO") {
        throw new Error("Billed amount is too small to produce a positive partner reward.");
      }
      throw new Error(result?.error || "Atomic partner reward failed.");
    }

    const reward = Math.max(0, Number(result.reward) || 0);
    const rate = Number(result.rewardRate) || PARTNER_REWARD_RATE;
    const tierBefore = result.rewardTier || latestPartner.rewardTier || "basic";
    const nowIso = new Date().toISOString();
    const marker = {
      amount: reward,
      status: `reward:${orderNumber}:rate:${Math.round(rate * 100)}:tier:${tierBefore}`,
      requestedAt: nowIso,
    };
    const next: MarketingPartner = {
      ...latestPartner,
      rewardTier: result.rewardTierAfter || latestPartner.rewardTier || "basic",
      qualificationCoins: Math.max(0, Number(result.qualificationCoins) || 0),
      qualificationPeriodStartedAt: result.qualificationPeriodStartedAt || undefined,
      walletBalance: Math.max(0, Number(result.balance) || 0),
      totalRewards: Math.max(0, Number(result.totalRewards) || 0),
      totalSales: Math.max(0, Number(result.totalSales) || 0),
      referredCustomers: Math.max(0, Number(result.referredCustomers) || 0),
      usageCount: Math.max(0, Number(result.usageCount) || 0),
      withdrawalRequests: [marker, ...existingOrders].slice(0, 100),
    };
    const { error: metadataError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { ...currentData.user.app_metadata, marketing_partner: next },
    });
    if (metadataError) throw metadataError;
    return next;
  }

  // All reward calculations below use the freshest persisted partner state.
  partner = latestPartner;
  const now = new Date();
  const nowIso = now.toISOString();
  const periodStart = partner.qualificationPeriodStartedAt ? new Date(partner.qualificationPeriodStartedAt) : now;
  const periodStartMs = periodStart.getTime();
  const elapsedSincePeriodStart = now.getTime() - periodStartMs;
  const periodIsValid = Number.isFinite(periodStartMs) && elapsedSincePeriodStart >= 0 && elapsedSincePeriodStart < 30 * 24 * 60 * 60 * 1000;
  const qualificationPeriodStartedAt = periodIsValid ? periodStart.toISOString() : nowIso;
  const coinsBeforeOrderInWindow = periodIsValid ? Math.max(0, Number(partner.qualificationCoins ?? 0)) : 0;
  const currentTier = partner.rewardTier ?? "basic";
  const rewardRate = currentTier === "gold" ? 0.30 : currentTier === "silver" ? 0.27 : PARTNER_REWARD_RATE;
  const reward = Math.max(0, Math.round(billedAmountInr * rewardRate));
  const lifetimeCoinsBeforeOrder = Math.max(0, Number(partner.totalRewards ?? 0));
  const qualificationCoinsAfterOrder = coinsBeforeOrderInWindow + reward;

  // Tier qualification uses only coins earned in this 30-day window.
  // The current order is paid at the existing tier; any upgrade applies to later orders.
  let nextTier: NonNullable<MarketingPartner["rewardTier"]> = currentTier;
  if ((currentTier === "basic" || currentTier === "silver") && qualificationCoinsAfterOrder >= 3000) nextTier = "silver";
  if (qualificationCoinsAfterOrder >= 5000) nextTier = "gold";
  let next: MarketingPartner = {
    ...partner,
    rewardTier: nextTier,
    qualificationCoins: qualificationCoinsAfterOrder,
    qualificationPeriodStartedAt,
    walletBalance: Math.max(0, Number(partner.walletBalance ?? 0)) + reward,
    totalRewards: lifetimeCoinsBeforeOrder + reward,
    totalSales: Math.max(0, Number(partner.totalSales ?? 0)) + Math.max(0, billedAmountInr),
    referredCustomers: Math.max(0, Number(partner.referredCustomers ?? 0)) + 1,
    usageCount: Math.max(0, Number(partner.usageCount ?? 0)) + 1,
    withdrawalRequests: [
      { amount: reward, status: `reward:${orderNumber}:rate:${Math.round(rewardRate * 100)}:tier:${currentTier}`, requestedAt: nowIso },
      ...existingOrders,
    ].slice(0, 100),
  };

  if (isWalletLedgerEnabled && reward > 0) {
    const wallet = await postWalletTransaction({
      partnerUserId: userId,
      type: "reward",
      amountInr: reward,
      referenceId: `order:${orderNumber}`,
      description: `Partner reward for order ${orderNumber}`,
      metadata: { orderNumber, rewardRate, rewardTier: currentTier, billedAmountInr },
    });
    // The ledger is authoritative for money. If a concurrent callback already
    // posted this reward, do not increment aggregate metadata a second time.
    // We still repair the missing per-order marker and wallet balance. Aggregate
    // reconciliation from ledger can correct counters if the first metadata
    // write failed after the ledger commit.
    if (wallet.duplicate) {
      // Repair only the missing per-order marker and balance here. Aggregate
      // reward/sales/qualification totals are deliberately not incremented on a
      // duplicate ledger post, because that would double-count concurrent retries.
      next = {
        ...partner,
        walletBalance: Number(wallet.balance ?? partner.walletBalance ?? 0),
        withdrawalRequests: [
          { amount: reward, status: `reward:${orderNumber}:rate:${Math.round(rewardRate * 100)}:tier:${currentTier}`, requestedAt: nowIso },
          ...existingOrders,
        ].slice(0, 100),
      };
    } else {
      next = { ...next, walletBalance: Number(wallet.balance ?? next.walletBalance ?? 0) };
    }
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...currentData.user.app_metadata, marketing_partner: next },
  });
  if (error) throw error;
  return next;
}
