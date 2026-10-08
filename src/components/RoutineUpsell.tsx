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
        const addNames = offer.missing
          .map((item) => item.name.replace("Fullmoon ", "").replace("Blemish Block ", "").replace("Velvet Touch ", ""))
          .join(" + ");

        return (
          <div key={offer.bundle.name} className="rounded-2xl border border-[var(--line)] bg-white/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 shrink-0">
                {offer.missing.map((item) => (
                  <div key={item.id} className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white bg-white shadow-sm">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] text-center block p-1 text-[var(--muted)]">{item.name}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-[var(--ink)]">
                  Add {addNames} <span className="whitespace-nowrap">@ &#8377;{offer.specialMissing}</span>
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-1">
                  Regularly &#8377;{offer.regularMissing} · <span className="font-semibold text-green-700">Save &#8377;{offer.saving}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => addOffer(offer)}
                className="shrink-0 rounded-full bg-[var(--deep-wine)] px-3.5 py-2.5 text-[11px] font-semibold text-white hover:bg-[var(--ink)] transition-colors"
              >
                {added === offer.bundle.name ? "Added ✓" : "Add & Save ₹" + offer.saving}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
