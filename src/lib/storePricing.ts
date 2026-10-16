import { supabaseAdmin } from "@/lib/supabase";

export type DiscountRule = { enabled: boolean; type: "percent" | "fixed"; value: number; startsAt?: string | null; endsAt?: string | null; };
export type StorePricingSettings = { discounts: Record<"firstOrder"|"bundle"|"prepaid"|"businessProgramme"|"festival"|"special", DiscountRule>; updatedAt?: string | null; };
const defaults: StorePricingSettings = { discounts: {
  firstOrder: { enabled: true, type: "percent", value: 10 },
  bundle: { enabled: true, type: "percent", value: 8 },
  prepaid: { enabled: true, type: "percent", value: 3 },
  businessProgramme: { enabled: true, type: "percent", value: 10 },
  festival: { enabled: false, type: "percent", value: 0 },
  special: { enabled: false, type: "percent", value: 0 },
}};
export async function getStorePricingSettings(): Promise<StorePricingSettings> {
  try {
    const { data, error } = await supabaseAdmin().from("store_pricing_settings").select("settings").eq("id","active").maybeSingle();
    if (error || !data?.settings) return defaults;
    return data.settings as StorePricingSettings;
  } catch { return defaults; }
}
export function discountAmount(rule: DiscountRule | undefined, amount: number, now = Date.now()) {
  if (!rule?.enabled || !Number.isFinite(amount) || amount <= 0) return 0;
  if (rule.startsAt && new Date(rule.startsAt).getTime() > now) return 0;
  if (rule.endsAt && new Date(rule.endsAt).getTime() < now) return 0;
  const value = Math.max(0, Number(rule.value) || 0);
  return Math.min(Math.round(amount), Math.round(rule.type === "percent" ? amount * Math.min(100, value) / 100 : value));
}
