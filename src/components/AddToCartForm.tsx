"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

export default function AddToCartForm({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  function handleAdd() {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addItem(product, quantity);
    router.push("/cart");
  }

  const outOfStock = product.stock_quantity <= 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border border-[var(--line)] rounded-full">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-9 h-9 flex items-center justify-center text-[var(--deep-wine)]"
          aria-label="Decrease quantity"
        >
          &minus;
        </button>
        <span className="w-6 text-center text-sm">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
          className="w-9 h-9 flex items-center justify-center text-[var(--deep-wine)]"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className="flex-1 bg-white border border-[var(--line)] border border-[var(--deep-wine)]/30 text-[var(--deep-wine)] px-6 py-3 rounded-full text-sm font-medium hover:bg-white transition-colors disabled:opacity-40"
      >
        {outOfStock ? "Out of stock" : added ? "Added" : "Add to cart"}
      </button>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={outOfStock}
        className="flex-1 bg-[var(--deep-wine)] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[var(--ink)] transition-colors disabled:opacity-40"
      >
        Buy now
      </button>
    </div>
  );
}
