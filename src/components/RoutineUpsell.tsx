"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { getRoutineUpsells } from "@/lib/bundles";

export default function RoutineUpsell({ product, products }: { product: Product; products: Product[] }) {
  const { lines, addItem, removeItem } = useCart();
  const [added, setAdded] = useState<string | null>(null);
  const [addedSlugs, setAddedSlugs] = useState<string[]>([]);
  const offers = getRoutineUpsells(product, products);

  if (!offers.length) return null;

  const activeOffer = offers.find((offer) =>
    offer.missing.every((item) => lines.some((line) => line.slug === item.slug && line.quantity > 0))
  );
  const offerLocked = Boolean(added || activeOffer);

  function addOffer(offer: (typeof offers)[number]) {
    if (offerLocked) return;
    offer.missing.forEach((item) => addItem(item, 1));
    setAdded(offer.bundle.name);
    setAddedSlugs(offer.missing.map((item) => item.slug));
  }

  function removeOffer() {
    addedSlugs.forEach((slug) => {
      const line = lines.find((item) => item.slug === slug);
      if (line) removeItem(line.productId);
    });
    setAdded(null);
    setAddedSlugs([]);
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
          <div
            key={offer.bundle.name}
            className={"rounded-2xl border p-3.5 transition-opacity " + (
              offerLocked && activeOffer?.bundle.name !== offer.bundle.name && added !== offer.bundle.name
                ? "border-[var(--line)] bg-white/40 opacity-35"
                : "border-[var(--line)] bg-white/80"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 shrink-0">
                {offer.missing.map((item) => (
                  <div key={item.id} className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white bg-white shadow-sm">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[7px] text-center block p-1 text-[var(--muted)]">{item.name}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight text-[var(--ink)]">
                  Add {addNames} @ &#8377;{offer.specialMissing}
                </p>
                <p className="text-[11px] leading-tight text-[var(--muted)] mt-1">
                  Regular &#8377;{offer.regularMissing} · <span className="font-semibold text-green-700">Save &#8377;{offer.saving}</span>
                </p>
              </div>
            </div>

            {added === offer.bundle.name ? (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 rounded-full bg-green-50 border border-green-200 px-4 py-2.5 text-center text-[11px] font-semibold text-green-700">
                  Added ✓
                </div>
                <button
                  type="button"
                  onClick={removeOffer}
                  className="rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--deep-wine)] hover:border-[var(--deep-wine)] transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={offerLocked}
                onClick={() => addOffer(offer)}
                className="mt-3 w-full rounded-full bg-[var(--deep-wine)] px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-[var(--ink)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add & Save &#8377;{offer.saving}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
