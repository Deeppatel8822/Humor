"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { getRoutineUpsells } from "@/lib/bundles";

export default function RoutineUpsell({ product, products }: { product: Product; products: Product[] }) {
  const { lines, addItem, removeItem, launchOfferActive } = useCart();
  const [added, setAdded] = useState<string | null>(null);
  const [addedSlugs, setAddedSlugs] = useState<string[]>([]);
  const [bundleDiscountPercent, setBundleDiscountPercent] = useState(8);
  useEffect(() => { fetch("/api/admin/pricing", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { const rule = data?.discounts?.bundle ?? data?.settings?.discounts?.bundle; if (rule) setBundleDiscountPercent(rule.enabled && rule.type === "percent" ? Number(rule.value) || 0 : 0); }).catch(() => {}); }, []);
  const offers = getRoutineUpsells(product, products, bundleDiscountPercent);

  if (launchOfferActive || !offers.length) return null;

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
        const addNames = offer.missing.map((item) => item.name).join(" + ");

        return (
          <div
            key={offer.bundle.name}
            className={"rounded-2xl border p-3 transition-opacity " + (
              offerLocked && activeOffer?.bundle.name !== offer.bundle.name && added !== offer.bundle.name
                ? "border-[var(--line)] bg-white/40 opacity-35"
                : "border-[var(--line)] bg-white/80"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex shrink-0 items-center gap-1.5">
                {offer.missing.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    {index > 0 && <span className="text-xs text-[var(--muted)]">+</span>}
                    <div className="h-12 w-12 overflow-hidden rounded-lg border border-[var(--line)] bg-white flex shrink-0 items-center justify-center">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.name} loading="lazy" className="h-full w-full object-contain p-0.5" />
                      ) : (
                        <span className="px-1 text-center text-[8px] leading-tight text-[var(--muted)]">{item.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-snug text-[var(--ink)]">
                  Add {addNames} for &#8377;{offer.specialMissing}
                </p>
                <p className="text-[11px] font-medium leading-tight text-green-700 mt-1">
                  Save &#8377;{offer.saving} on this offer
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
                className="mt-2.5 w-full rounded-full bg-[var(--deep-wine)] px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-[var(--ink)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add & Save
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
