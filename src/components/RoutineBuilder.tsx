"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";

const options = [
  { key: "acne", label: "Acne & Blemishes", subrange: "Blemish Block" },
  { key: "dry", label: "Dry / Dull Skin", subrange: "Fullmoon" },
  { key: "everyday", label: "Everyday Skin Care", subrange: "Velvet Touch" },
  { key: "hair", label: "Hair Care", category: "haircare" as const },
  { key: "body", label: "Body Care", category: "bodycare" as const },
  { key: "sun", label: "Sun Protection", slug: "sunscreen-spf-50" },
];

export default function RoutineBuilder({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const option = options.find((o) => o.key === selected);

  let recommended: Product[] = [];
  if (option) {
    if (option.subrange) {
      recommended = products.filter((p) => p.subrange === option.subrange);
      const sunscreen = products.find((p) => p.slug === "sunscreen-spf-50");
      if (sunscreen) recommended = [...recommended, sunscreen];
    } else if (option.category) {
      recommended = products.filter((p) => p.category === option.category);
    } else if (option.slug) {
      const p = products.find((p) => p.slug === option.slug);
      if (p) recommended = [p];
    }
  }

  const stepLabels = ["Cleanse", "Treat", "Protect"];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => setSelected(o.key)}
            className={`text-left px-5 py-4 rounded-xl border text-sm font-medium transition-colors ${
              selected === o.key
                ? "border-[var(--deep-wine)] bg-[var(--milk-sage)] text-[var(--deep-wine)]"
                : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--deep-wine)]/40"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {option && recommended.length > 0 && (
        <div>
          <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-6">
            Your recommended routine
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {recommended.map((p, i) => (
              <div key={p.id}>
                <div className="text-[11px] uppercase tracking-wide text-[var(--warm-gold)] font-semibold mb-2">
                  Step {String(i + 1).padStart(2, "0")}{stepLabels[i] ? ` — ${stepLabels[i]}` : ""}
                </div>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
