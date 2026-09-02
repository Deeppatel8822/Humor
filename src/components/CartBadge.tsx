"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartBadge() {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" aria-label="Cart" className="p-2 relative text-[var(--ink)] hover:text-[var(--deep-wine)]">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 6h15l-1.5 9h-12z" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
        <path d="M6 6 5 2H2" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-[var(--deep-wine)] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
