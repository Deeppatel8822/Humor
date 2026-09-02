"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

export default function AddBundleButton({ products, label = "Add Bundle to Cart" }: { products: Product[]; label?: string }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    products.forEach((p) => addItem(p, 1));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      className="bg-[var(--deep-wine)] text-white px-5 py-2.5 rounded-full text-xs font-medium hover:bg-[var(--ink)] transition-colors"
    >
      {added ? "Added to cart" : label}
    </button>
  );
}

