"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { getRoutineUpsells } from "@/lib/bundles";

export default function RoutineUpsell({ product, products }: { product: Product; products: Product[] }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState<string | null>(null);
  const offers = getRoutineUpsells(product, products);

  if (!offers.length) return null;

  function addOffer(offer: (typeof offers)[number]) {
    offer.missing.forEach((item) => addItem(item, 1));
    setAdded(offer.bundle.name);
    window.setTimeout(() => setAdded(null), 2200);
  }

  return (
    <div className="space-y-3 mb-6" aria-label="Routine bundle offers">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--warm-gold)]">Exclusive routine offer</span>
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      {offers.map((offer) => {
        const single = offer.missing.length === 1;
        const missingNames = offer.missing
          .map((item) => item.name.replace("Fullmoon ", "").replace("Blemish Block ", "").replace("Velvet Touch ", ""))
          .join(" + ");

        return (
          <div key={offer.bundle.name} className="rounded-2xl border border-[var(--line)] bg-[var(--milk-sage)] p-4 md:p-5 shadow-[0_8px_30px_rgba(48,35,59,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 shrink-0">
                {offer.missing.map((item) => (
                  <div key={item.id} className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white bg-white shadow-sm">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] text-center block p-1 text-[var(--muted)]">{item.name}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--ink)]">Add {missingNames}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {single ? "Special routine price" : "Complete the routine at a special price"}
                  {" · "}
                  <span className="font-semibold text-[var(--deep-wine)]">&#8377;{offer.specialMissing}</span>
                  {offer.saving > 0 && <> · Save &#8377;{offer.saving}</>}
                </p>
              </div>

              <button
                type="button"
                onClick={() => addOffer(offer)}
                className="shrink-0 rounded-full border border-[var(--deep-wine)] bg-white px-3.5 py-2 text-[11px] font-semibold text-[var(--deep-wine)] hover:bg-[var(--deep-wine)] hover:text-white transition-colors"
              >
                {added === offer.bundle.name ? "Added ✓" : single ? "Add ₹" + offer.specialMissing : "Add offer"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
