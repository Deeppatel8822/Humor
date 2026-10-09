"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import CartPopup from "@/components/CartPopup";

export default function CartBadge() {
  const { lines, itemCount, subtotalInr } = useCart();
  const [open, setOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const openCart = () => setOpen(true);
    window.addEventListener("humor-open-cart-popup", openCart);
    return () => window.removeEventListener("humor-open-cart-popup", openCart);
  }, []);

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setHoverOpen(true)}
        onMouseLeave={() => setHoverOpen(false)}
      >
        <button
          type="button"
          aria-label={`Open cart, ${itemCount} items`}
          aria-expanded={hoverOpen}
          onClick={() => { setHoverOpen(false); setOpen(true); }}
          className="relative rounded-full p-2 text-[var(--ink)] transition-colors hover:text-[var(--deep-wine)]"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12z" />
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
            <path d="M6 6 5 2H2" />
          </svg>
          {itemCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--deep-wine)] px-1 text-[10px] text-white">{itemCount}</span>}
        </button>

        {hoverOpen && (
          <div
            className="absolute right-0 top-full z-[90] w-[340px] max-w-[calc(100vw-24px)] pt-3"
            onMouseEnter={() => setHoverOpen(true)}
          >
            <div className="overflow-hidden rounded-2xl border border-[#E9DFEF] bg-white shadow-[0_18px_55px_rgba(35,20,45,0.2)] ring-1 ring-black/5">
              <div className="flex items-center justify-between border-b border-[#F0E8F4] bg-gradient-to-r from-[#FBF8FD] to-[#F5EDF9] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#35243F]">Your Beauty Bag</p>
                  <p className="mt-0.5 text-[11px] text-[#776981]">{itemCount} {itemCount === 1 ? "item" : "items"} in your cart</p>
                </div>
                <span className="text-sm font-semibold text-[#7047A0]">₹{subtotalInr.toLocaleString("en-IN")}</span>
              </div>

              {lines.length === 0 ? (
                <div className="px-5 py-7 text-center">
                  <p className="text-sm text-[#65566D]">Your beauty bag is empty.</p>
                  <Link href="/shop" onClick={() => setHoverOpen(false)} className="mt-3 inline-flex rounded-full bg-[#7047A0] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#5B3789]">Explore the collection</Link>
                </div>
              ) : (
                <>
                  <div className="max-h-[310px] overflow-y-auto p-3">
                    <div className="space-y-3">
                      {lines.slice(0, 4).map((line) => (
                        <div key={line.productId} className="flex items-center gap-3">
                          <Link href={`/product/${line.slug}`} onClick={() => setHoverOpen(false)} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F8F4FA]">
                            {line.image ? <img src={line.image} alt={line.name} className="h-full w-full object-contain p-1.5" /> : <span className="px-1 text-center text-[9px] text-[#7047A0]">{line.name}</span>}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link href={`/product/${line.slug}`} onClick={() => setHoverOpen(false)} className="line-clamp-2 text-xs font-medium text-[#35243F] hover:text-[#7047A0]">{line.name}</Link>
                            <p className="mt-1 text-[11px] text-[#776981]">Qty: {line.quantity}</p>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-[#50336F]">₹{(line.price_inr * line.quantity).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                    {lines.length > 4 && <p className="mt-3 text-center text-[11px] text-[#776981]">+ {lines.length - 4} more products</p>}
                  </div>
                  <div className="border-t border-[#F0E8F4] bg-[#FCFAFD] p-3">
                    <button type="button" onClick={() => { setHoverOpen(false); setOpen(true); }} className="w-full rounded-full bg-gradient-to-r from-[#7047A0] to-[#50336F] px-4 py-3 text-xs font-semibold text-white shadow-md shadow-[#7047A0]/20 transition hover:brightness-110">View cart & checkout</button>
                    <p className="mt-2 text-center text-[10px] text-[#8B7D92]">Secure checkout · HUMOR LUXURY</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <CartPopup open={open} onClose={close} />
    </>
  );
}
