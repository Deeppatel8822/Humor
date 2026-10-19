"use client";

import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

export default function LaunchOfferPrice({ product, volume }: { product: Product; volume: string }) {
  const { launchOfferActive, getDisplayPrice } = useCart();
  const price = getDisplayPrice(product);
  const onSale = !launchOfferActive && product.compare_at_price_inr && product.compare_at_price_inr > product.price_inr;
  const discountPct = onSale ? Math.round((1 - product.price_inr / product.compare_at_price_inr!) * 100) : 0;

  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-2xl md:text-3xl font-semibold text-[var(--deep-wine)]">&#8377;{price}</span>
      {onSale && <span className="text-base text-[var(--ink)]/40 line-through">&#8377;{product.compare_at_price_inr}</span>}
      {onSale && <span className="rounded-full bg-pink-100 text-pink-700 px-3 py-1 text-xs font-semibold">{discountPct}% OFF</span>}
      {launchOfferActive && <span className="rounded-full bg-[var(--deep-wine)] text-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide">Launch Offer</span>}
      <span className="ml-auto whitespace-nowrap text-sm md:text-base text-[var(--ink)]/75">{volume || ""}</span>
    </div>
  );
}
