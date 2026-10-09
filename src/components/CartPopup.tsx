"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

const imageFallbacks: Record<string, string> = {
  "blemish-block-face-wash": "/products/blemish-block-face-wash-main.webp",
  "velvet-touch-face-wash": "/products/velvet-touch-face-wash-main.webp",
  "fullmoon-face-wash": "/products/fullmoon-face-wash-main.webp",
  "blemish-block-face-serum": "/products/blemish-block-face-serum-main.webp",
  "velvet-touch-face-serum": "/products/velvet-touch-face-serum-main.webp",
  "fullmoon-face-serum": "/products/fullmoon-face-serum-main.webp",
  "repair-shampoo": "/products/protein-shake-shampoo-main.webp",
  "repair-conditioner": "/products/conditioner-main.webp",
  "repair-hair-mask": "/products/milk-shake-hair-mask-main.webp",
  "sunscreen-spf-50": "/products/sunscreen-main.webp",
  "shower-gel": "/products/shower-gel-main.webp",
};

export default function CartPopup({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, updateQuantity, removeItem, subtotalInr, bundleSavingsInr, startCheckout } = useCart();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);
  const threshold = 299;
  const netSubtotal = Math.max(0, subtotalInr - bundleSavingsInr);
  const shipping = netSubtotal >= threshold ? 0 : 50;
  const amountToFreeShipping = Math.max(0, threshold - subtotalInr);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function checkout() {
    if (!lines.length) return;
    setCheckingOut(true);
    try {
      const result = await startCheckout();
      onClose();
      if (result.mode === "shopify" && result.url) window.location.href = result.url;
      else router.push("/checkout");
    } finally {
      setCheckingOut(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#21172b]/55 backdrop-blur-md cart-popup-backdrop" />
      <section role="dialog" aria-modal="true" aria-labelledby="cart-popup-title" className="cart-glass-panel relative flex max-h-[min(86dvh,760px)] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-[0_30px_100px_rgba(28,14,43,0.32)] sm:rounded-[32px]">
        <header className="flex items-start justify-between border-b border-[#E9DFEF] bg-gradient-to-br from-[#FBF8FD] via-white to-[#F5EDF9] px-5 py-5 sm:px-7 sm:py-6">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#A47A55]">HUMOR LUXURY</p>
            <h2 id="cart-popup-title" className="font-display text-2xl text-[#35243F] sm:text-3xl">Your Beauty Bag</h2>
            <p className="mt-1 text-xs text-[#776981]">{lines.length ? `${lines.length} selected ${lines.length === 1 ? "essential" : "essentials"}` : "A little luxury is waiting for you"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close cart" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4D8EC] bg-white/80 text-[#50336F] shadow-sm transition hover:bg-[#F4ECF8]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#E5D8EE] bg-[#F7F1FA] text-[#7047A0]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 7h12l1 14H5L6 7Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
            </div>
            <h3 className="font-display text-xl text-[#35243F]">Your bag is taking a beauty break</h3>
            <p className="mt-2 max-w-xs text-sm text-[#776981]">Explore your favourites and add something lovely to your routine.</p>
            <Link href="/shop" onClick={onClose} className="mt-6 inline-flex items-center justify-center rounded-full bg-[#7047A0] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7047A0]/20">Explore the collection</Link>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7 sm:py-5">
              <div className="mb-4 rounded-2xl border border-[#E6D8EF] bg-gradient-to-r from-[#F8F2FB] to-[#FFF9F6] px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#654D76]">{subtotalInr >= threshold ? "You’re eligible for free shipping!" : `Add ₹${amountToFreeShipping} more to get free shipping.`}</span>
                  <span className="font-semibold text-[#7047A0]">{subtotalInr >= threshold ? "Unlocked ✓" : `₹${threshold}+`}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E8DDEC]"><div className="h-full rounded-full bg-gradient-to-r from-[#7047A0] to-[#C58A62] transition-all" style={{ width: `${Math.min(100, (subtotalInr / threshold) * 100)}%` }} /></div>
              </div>

              <div className="space-y-3">
                {lines.map((line) => {
                  const image = line.image ?? imageFallbacks[line.slug];
                  return (
                    <article key={line.productId} className="flex gap-3 rounded-2xl border border-[#EEE5F2] bg-white/80 p-3 sm:gap-4 sm:p-4">
                      <Link href={`/product/${line.slug}`} onClick={onClose} className="flex h-[84px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F8F4FA] sm:h-24 sm:w-24">
                        {image ? <img src={image} alt={line.name} className="h-full w-full object-contain p-2" /> : <span className="px-1 text-center text-[10px] text-[#7047A0]">{line.name}</span>}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${line.slug}`} onClick={onClose} className="line-clamp-2 text-sm font-medium text-[#35243F] hover:text-[#7047A0]">{line.name}</Link>
                        <p className="mt-1 text-sm font-semibold text-[#7047A0]">₹{line.price_inr.toLocaleString("en-IN")}</p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center rounded-full border border-[#E4D8EC] bg-[#FBF8FD] p-0.5">
                            <button type="button" aria-label={`Decrease quantity of ${line.name}`} onClick={() => updateQuantity(line.productId, line.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-[#50336F] hover:bg-white">−</button>
                            <span className="w-7 text-center text-xs font-medium text-[#35243F]">{line.quantity}</span>
                            <button type="button" aria-label={`Increase quantity of ${line.name}`} onClick={() => updateQuantity(line.productId, line.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-[#50336F] hover:bg-white">+</button>
                          </div>
                          <button type="button" onClick={() => removeItem(line.productId)} className="text-xs text-[#8A788F] underline decoration-[#D9CDE3] underline-offset-4 hover:text-[#B15E83]">Remove</button>
                        </div>
                      </div>
                      <div className="hidden w-[76px] shrink-0 text-right text-sm font-semibold text-[#35243F] sm:block">₹{(line.price_inr * line.quantity).toLocaleString("en-IN")}</div>
                    </article>
                  );
                })}
              </div>
            </div>
            <footer className="border-t border-[#E9DFEF] bg-white/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:pt-5">
              <div className="mb-3 flex items-center justify-between text-sm"><span className="text-[#776981]">Subtotal</span><span className="font-medium text-[#35243F]">₹{subtotalInr.toLocaleString("en-IN")}</span></div>
              {bundleSavingsInr > 0 && <div className="mb-3 flex items-center justify-between text-sm"><span className="text-[#776981]">Bundle savings</span><span className="font-medium text-green-700">−₹{bundleSavingsInr.toLocaleString("en-IN")}</span></div>}
              <div className="mb-3 flex items-center justify-between text-sm"><span className="text-[#776981]">Shipping</span><span className={shipping === 0 ? "font-medium text-green-700" : "text-[#35243F]"}>{shipping === 0 ? "Free" : "₹50"}</span></div>
              <div className="mb-4 flex items-center justify-between border-t border-dashed border-[#E4D8EC] pt-3"><span className="font-semibold text-[#35243F]">Estimated total</span><span className="font-display text-2xl text-[#50336F]">₹{(netSubtotal + shipping).toLocaleString("en-IN")}</span></div>
              <button type="button" onClick={checkout} disabled={checkingOut} className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7047A0] to-[#50336F] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#7047A0]/25 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">{checkingOut ? "Preparing checkout…" : "Proceed to checkout"}<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
              <button type="button" onClick={onClose} className="mt-2 w-full rounded-full px-4 py-2.5 text-xs font-medium text-[#6E5C79] hover:bg-[#F8F3FA]">Continue shopping</button>
              <p className="mt-1 text-center text-[10px] tracking-wide text-[#8B7D92]">A little luxury, just for you</p>
            </footer>
          </>
        )}
      </section>
      <style jsx>{`
        .cart-popup-backdrop { animation: cartBackdropIn 180ms ease-out both; }
        .cart-glass-panel { animation: cartPanelIn 240ms cubic-bezier(.2,.8,.2,1) both; backdrop-filter: blur(24px) saturate(140%); -webkit-backdrop-filter: blur(24px) saturate(140%); }
        @keyframes cartBackdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cartPanelIn { from { opacity: 0; transform: translateY(12px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { .cart-popup-backdrop, .cart-glass-panel { animation: none; } }
      `}</style>
    </div>
  );
}
