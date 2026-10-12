import { supabaseAdmin } from "@/lib/supabase";

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
  /** Permanent reward tier: basic (25%), silver (27%), gold (30%), or elite (30%). */
  rewardTier?: "basic" | "silver" | "gold" | "elite";
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
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((candidate) => {
    const partner = getPartner(candidate);
    return partnerIsActive(partner) && partner?.code?.toUpperCase() === clean;
  });
  if (!user) return null;
  return { user, partner: getPartner(user)! };
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
  const existingOrders = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];
  const alreadyCredited = existingOrders.some((entry) => entry.status === `reward:${orderNumber}`);
  if (alreadyCredited) return partner;

  const now = new Date();
  const nowIso = now.toISOString();
  const periodStart = partner.qualificationPeriodStartedAt ? new Date(partner.qualificationPeriodStartedAt) : now;
  const periodIsValid = Number.isFinite(periodStart.getTime()) && now.getTime() - periodStart.getTime() < 30 * 24 * 60 * 60 * 1000;
  const qualificationPeriodStartedAt = periodIsValid ? periodStart.toISOString() : nowIso;
  const coinsBeforeOrderInWindow = periodIsValid ? Math.max(0, Number(partner.qualificationCoins ?? 0)) : 0;
  const currentTier = partner.rewardTier ?? "basic";
  const rewardRate = currentTier === "elite" || currentTier === "gold" ? 0.30 : currentTier === "silver" ? 0.27 : PARTNER_REWARD_RATE;
  const reward = Math.max(0, Math.round(billedAmountInr * rewardRate));
  const lifetimeCoinsBeforeOrder = Math.max(0, Number(partner.totalRewards ?? 0));
  const qualificationCoinsAfterOrder = coinsBeforeOrderInWindow + reward;

  // Tier qualification uses only coins earned in this 30-day window.
  // The current order is paid at the existing tier; any upgrade applies to later orders.
  let nextTier: NonNullable<MarketingPartner["rewardTier"]> = currentTier;
  if (currentTier === "basic" && qualificationCoinsAfterOrder >= 1000) nextTier = "silver";
  if ((currentTier === "basic" || currentTier === "silver") && qualificationCoinsAfterOrder >= 3000) nextTier = "gold";
  if (qualificationCoinsAfterOrder >= 5000) nextTier = "elite";
  const next: MarketingPartner = {
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

  const { data: currentData, error: currentError } = await admin.auth.admin.getUserById(userId);
  if (currentError || !currentData.user) throw currentError || new Error("Partner account not found.");
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...currentData.user.app_metadata, marketing_partner: next },
  });
  if (error) throw error;
  return next;
}
