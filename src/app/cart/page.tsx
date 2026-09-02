"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { lines, updateQuantity, removeItem, subtotalInr, startCheckout } = useCart();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);

  async function handleCheckout() {
    setCheckingOut(true);
    const result = await startCheckout();
    if (result.mode === "shopify" && result.url) {
      window.location.href = result.url;
    } else {
      router.push("/checkout");
    }
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-24 text-center">
        <h1 className="font-display text-3xl text-[var(--deep-wine)] mb-3">Your cart is empty</h1>
        <p className="text-[var(--muted)] mb-8">Add a product to start building your routine.</p>
        <Link
          href="/shop"
          className="inline-block bg-[var(--deep-wine)] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--ink)] transition-colors"
        >
          Shop all products
        </Link>
      </div>
    );
  }

  const freeShippingThreshold = 599;
  const remaining = Math.max(0, freeShippingThreshold - subtotalInr);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-14">
      <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-8">Your cart</h1>

      {remaining > 0 ? (
        <div className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl px-5 py-3 text-sm text-[var(--deep-wine)] mb-8">
          Add &#8377;{remaining} more to unlock free shipping.
        </div>
      ) : (
        <div className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl px-5 py-3 text-sm text-[var(--moss)] mb-8">
          You&apos;ve unlocked free shipping.
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-4">
          {lines.map((line) => (
            <div key={line.productId} className="flex items-center gap-4 bg-white border border-[var(--line)] rounded-xl p-4">
              <div className="w-20 h-20 rounded-lg bg-[var(--milk-sage)] flex-shrink-0 flex items-center justify-center">
                <span className="font-display text-[10px] text-[var(--deep-wine)]/40 text-center px-1">{line.name}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/product/${line.slug}`} className="text-sm font-medium text-[var(--ink)] hover:text-[var(--deep-wine)]">
                  {line.name}
                </Link>
                <div className="text-sm text-[var(--muted)] mt-1">&#8377;{line.price_inr}</div>
              </div>
              <div className="flex items-center border border-[var(--line)] rounded-full">
                <button type="button" onClick={() => updateQuantity(line.productId, line.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-[var(--deep-wine)]" aria-label="Decrease quantity">&minus;</button>
                <span className="w-6 text-center text-sm">{line.quantity}</span>
                <button type="button" onClick={() => updateQuantity(line.productId, line.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-[var(--deep-wine)]" aria-label="Increase quantity">+</button>
              </div>
              <div className="text-sm font-semibold text-[var(--ink)] w-16 text-right">&#8377;{line.price_inr * line.quantity}</div>
              <button type="button" onClick={() => removeItem(line.productId)} aria-label="Remove item" className="text-[var(--muted)] hover:text-[var(--dusty-rose)] p-1">&#10005;</button>
            </div>
          ))}
        </div>

        <div className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl p-6 h-fit">
          <h2 className="font-display text-xl text-[var(--deep-wine)] mb-5">Order summary</h2>
          <div className="flex justify-between text-sm text-[var(--muted)] mb-2">
            <span>Subtotal</span><span>&#8377;{subtotalInr}</span>
          </div>
          <div className="flex justify-between text-sm text-[var(--muted)] mb-4">
            <span>Shipping</span><span>{remaining > 0 ? "Calculated at checkout" : "Free"}</span>
          </div>
          <div className="border-t border-[var(--line)] pt-4 flex justify-between text-base font-semibold text-[var(--ink)] mb-6">
            <span>Total</span><span>&#8377;{subtotalInr}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            className="w-full text-center bg-[var(--deep-wine)] text-white px-6 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--ink)] transition-colors disabled:opacity-60"
          >
            {checkingOut ? "Redirecting..." : "Proceed to checkout"}
          </button>
          <div className="flex items-center justify-center gap-4 mt-5 text-xs text-[var(--muted)]">
            <span>Razorpay Secure</span><span>&middot;</span><span>UPI / Cards / COD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
