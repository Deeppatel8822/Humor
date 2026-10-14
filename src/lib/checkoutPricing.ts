export interface CheckoutPricingInput {
  subtotalInr: number;
  firstOrderDiscountInr: number;
  partnerDiscountInr: number;
  bundleSavingsInr: number;
}

export function calculateCheckoutPricing({
  subtotalInr,
  firstOrderDiscountInr,
  partnerDiscountInr,
  bundleSavingsInr,
}: CheckoutPricingInput) {
  const safeSubtotal = Math.max(0, Math.round(subtotalInr));
  const safeBundleSavings = Math.max(0, Math.round(bundleSavingsInr));
  const shippingBaseInr = Math.max(0, safeSubtotal - safeBundleSavings);
  const shippingInr = shippingBaseInr >= 299 ? 0 : 50;
  const prepaidDiscountInr = Math.round(safeSubtotal * (safeSubtotal >= 1000 ? 0.04 : 0.03));
  const totalDiscountInr =
    Math.max(0, Math.round(firstOrderDiscountInr)) +
    Math.max(0, Math.round(partnerDiscountInr)) +
    prepaidDiscountInr +
    safeBundleSavings;
  const totalInr = Math.max(0, safeSubtotal - totalDiscountInr + shippingInr);

  return { shippingInr, prepaidDiscountInr, totalDiscountInr, totalInr };
}
