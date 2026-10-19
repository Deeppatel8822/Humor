"use client";

import type { ReactNode } from "react";
import { useCart } from "@/context/CartContext";

export default function LaunchOfferGate({ children }: { children: ReactNode }) {
  const { launchOfferActive } = useCart();
  if (launchOfferActive) {
    return (
      <div className="rounded-2xl border border-[var(--warm-gold)]/40 bg-[var(--milk-sage)] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--warm-gold)]">Launch Offer active</p>
        <h2 className="mt-2 font-display text-2xl text-[var(--deep-wine)]">Individual launch prices are already unlocked</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Bundle deals and extra discounts are paused during this offer. Add products individually to your cart and each eligible item will use its launch price.</p>
        <a href="/shop" className="mt-5 inline-flex rounded-full bg-[var(--deep-wine)] px-5 py-3 text-sm font-medium text-white">Shop launch prices</a>
      </div>
    );
  }
  return <>{children}</>;
}
