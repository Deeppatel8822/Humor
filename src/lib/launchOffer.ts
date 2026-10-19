import type { Product } from "@/types/product";

/**
 * Temporary Humor Luxury launch pricing.
 * To end the campaign manually, set LAUNCH_OFFER_ENABLED to false.
 * Original catalog prices are never modified.
 */
export const LAUNCH_OFFER_ENABLED = true;

const launchPricesBySlug: Record<string, number> = {
  "fullmoon-face-wash": 59,
  "velvet-touch-face-wash": 59,
  "blemish-block-face-wash": 59,
  "fullmoon-face-serum": 69,
  "velvet-touch-face-serum": 69,
  "blemish-block-face-serum": 69,
  "sunscreen-spf-50": 149,
  "repair-shampoo": 199,
  "smooth-shake-daily-shampoo": 199,
  "repair-hair-mask": 249,
  "shower-gel": 29,
  "repair-conditioner": 149,
};


export const launchOfferDisplayItems = [
  { name: "Fullmoon Face Wash", price: 59 },
  { name: "Velvet Touch Face Wash", price: 59 },
  { name: "Blemish Block Face Wash", price: 59 },
  { name: "Fullmoon Face Serum", price: 69 },
  { name: "Velvet Touch Face Serum", price: 69 },
  { name: "Blemish Block Face Serum", price: 69 },
  { name: "Light & Shade Sunscreen SPF 50", price: 149 },
  { name: "Protein Shake Anti Hairfall Shampoo", price: 199 },
  { name: "Smooth Shake Daily Shampoo", price: 199 },
  { name: "Milk Shake Repairing Smooth Hair Mask", price: 249 },
  { name: "Royal Water Soft Shower Cream", price: 29 },
  { name: "Silk Shake Smooth Shine Conditioner", price: 149 },
] as const;

export function getLaunchOfferPrice(product: Pick<Product, "slug">): number | null {
  if (!LAUNCH_OFFER_ENABLED) return null;
  return launchPricesBySlug[product.slug] ?? null;
}

export function getEffectiveProductPrice(product: Product, launchOfferActive: boolean): number {
  if (!launchOfferActive) return product.price_inr;
  return getLaunchOfferPrice(product) ?? product.price_inr;
}

export function getLaunchOfferProductPrices() {
  return { ...launchPricesBySlug };
}
