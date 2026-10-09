"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import CartPopup from "@/components/CartPopup";

export default function CartBadge() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const openCart = () => setOpen(true);
    window.addEventListener("humor-open-cart-popup", openCart);
    return () => window.removeEventListener("humor-open-cart-popup", openCart);
  }, []);

  return (
    <>
      <button type="button" aria-label={`Open cart, ${itemCount} items`} onClick={() => setOpen(true)} className="relative rounded-full p-2 text-[var(--ink)] transition-colors hover:text-[var(--deep-wine)]">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 6h15l-1.5 9h-12z" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M6 6 5 2H2" />
        </svg>
        {itemCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--deep-wine)] px-1 text-[10px] text-white">{itemCount}</span>}
      </button>
      <CartPopup open={open} onClose={close} />
    </>
  );
}
