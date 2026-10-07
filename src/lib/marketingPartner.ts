import { supabaseAdmin } from "@/lib/supabase";

export const PARTNER_REWARD_RATE = 0.10;
export const PARTNER_CUSTOMER_DISCOUNT_RATE = 0.10;
export const PARTNER_MAX_DISCOUNT_PER_UNIT = 25;
export const PARTNER_CODE_VALIDITY_DAYS = 90;
export const PARTNER_USAGE_LIMIT = 1000;
export const PARTNER_MIN_WITHDRAWAL = 1000;

export interface MarketingPartner {
  status: "pending" | "approved" | "rejected";
  code?: string;
  expiresAt?: string;
  usageCount?: number;
  usageLimit?: number;
  walletBalance?: number;
  totalRewards?: number;
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
  if (!partner || partner.status !== "approved" || !partner.code || !partner.expiresAt) return false;
  return new Date(partner.expiresAt).getTime() >= Date.now() && (partner.usageCount ?? 0) < (partner.usageLimit ?? PARTNER_USAGE_LIMIT);
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
    const perUnit = Math.min(Math.round(line.priceInr * PARTNER_CUSTOMER_DISCOUNT_RATE), PARTNER_MAX_DISCOUNT_PER_UNIT);
    return sum + Math.max(0, perUnit) * line.quantity;
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

  const reward = Math.max(0, Math.round(billedAmountInr * PARTNER_REWARD_RATE));
  const next: MarketingPartner = {
    ...partner,
    walletBalance: Math.max(0, Number(partner.walletBalance ?? 0)) + reward,
    totalRewards: Math.max(0, Number(partner.totalRewards ?? 0)) + reward,
    totalSales: Math.max(0, Number(partner.totalSales ?? 0)) + Math.max(0, billedAmountInr),
    referredCustomers: Math.max(0, Number(partner.referredCustomers ?? 0)) + 1,
    usageCount: Math.max(0, Number(partner.usageCount ?? 0)) + 1,
    withdrawalRequests: [
      { amount: reward, status: `reward:${orderNumber}`, requestedAt: new Date().toISOString() },
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
