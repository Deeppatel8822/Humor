import { getAllProducts } from "@/lib/catalog";
import { Product } from "@/types/product";
import AddBundleButton from "@/components/AddBundleButton";
import { bundleTotal, bundlePrice, bundleDiscountPercent } from "@/lib/bundles";

export const metadata = {
  title: "Bundles | Humor Luxury",
  description: "Curated Humor Luxury routines at a bundle price.",
};


export default async function BundlesPage() {
  const products = await getAllProducts();
  const bySlug = (slug: string) => products.find((p) => p.slug === slug);

  const bundles = [
    {
      name: "Blemish Block Duo",
      items: [bySlug("blemish-block-face-wash"), bySlug("blemish-block-face-serum")].filter(Boolean) as Product[],
    },
    {
      name: "Fullmoon Duo",
      items: [bySlug("fullmoon-face-wash"), bySlug("fullmoon-face-serum")].filter(Boolean) as Product[],
    },
    {
      name: "Velvet Touch Duo",
      items: [bySlug("velvet-touch-face-wash"), bySlug("velvet-touch-face-serum")].filter(Boolean) as Product[],
    },
    {
      name: "Hair Care Ritual",
      items: [bySlug("repair-shampoo"), bySlug("repair-conditioner"), bySlug("repair-hair-mask")].filter(Boolean) as Product[],
    },
    {
      name: "Fullmoon Complete Routine",
      items: [bySlug("fullmoon-face-wash"), bySlug("fullmoon-face-serum"), bySlug("sunscreen-spf-50")].filter(Boolean) as Product[],
    },
    {
      name: "Blemish Block Complete Routine",
      items: [bySlug("blemish-block-face-wash"), bySlug("blemish-block-face-serum"), bySlug("sunscreen-spf-50")].filter(Boolean) as Product[],
    },
    {
      name: "Velvet Touch Complete Routine",
      items: [bySlug("velvet-touch-face-wash"), bySlug("velvet-touch-face-serum"), bySlug("sunscreen-spf-50")].filter(Boolean) as Product[],
    },
    {
      name: "Protein Shake Anti Hairfall Shampoo + Silk Shake Smooth Shine Conditioner",
      items: [bySlug("repair-shampoo"), bySlug("repair-conditioner")].filter(Boolean) as Product[],
    },
    {
      name: "Protein Shake Anti Hairfall Shampoo + Milk Shake Repairing Smooth Hair Mask",
      items: [bySlug("repair-shampoo"), bySlug("repair-hair-mask")].filter(Boolean) as Product[],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-14">
      <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-2">Bundles</h1>
      <p className="text-[var(--muted)] mb-2">Complete routines, bundled together.</p>
      <p className="text-xs text-[var(--muted)] mb-10">
        Special bundle pricing with psychological price points designed to feel like a better-value deal.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {bundles.map((bundle) => (
          <div key={bundle.name} className="border border-[var(--line)] rounded-2xl p-6">
            <h2 className="font-display text-xl text-[var(--deep-wine)] mb-4">{bundle.name}</h2>
            <div className="mb-5">
              <div className="flex items-center justify-center gap-2 md:gap-3">
                {bundle.items.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-2 md:gap-3 min-w-0">
                    {i > 0 && <span className="text-lg md:text-xl font-light text-[var(--muted)]">+</span>}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border border-[var(--line)] bg-white overflow-hidden flex items-center justify-center shrink-0 group/bundle-img">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover/bundle-img:scale-[1.05] active:scale-[1.05]" loading="lazy" />
                      ) : (
                        <span className="text-[10px] md:text-xs text-center text-[var(--muted)] px-2">{item.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 mt-3 text-[10px] md:text-xs text-[var(--muted)]">
                {bundle.items.map((item, i) => (
                  <span key={item.id} className="flex items-center gap-1">
                    {i > 0 && <span>•</span>}
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--muted)] line-through">
                    &#8377;{bundleTotal(bundle.items)}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full bg-[var(--deep-wine)] text-white px-2 py-1">
                    {bundleDiscountPercent(bundle.items, bundle.name)}% OFF
                  </span>
                </div>
                <span className="text-lg font-semibold text-[var(--ink)]">
                  &#8377;{bundlePrice(bundle.items, bundle.name)}
                </span>
              </div>
              <AddBundleButton products={bundle.items} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
