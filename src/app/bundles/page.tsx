import { getAllProducts } from "@/lib/catalog";
import { Product } from "@/types/product";
import AddBundleButton from "@/components/AddBundleButton";

export const metadata = {
  title: "Bundles | Humor Luxury",
  description: "Curated Humor Luxury routines at a bundle price.",
};

function bundleTotal(products: Product[]) {
  return products.reduce((sum, p) => sum + p.price_inr, 0);
}

function bundlePrice(products: Product[], bundleName: string) {
  // Psychological bundle pricing: keep the offer close to the target price point
  // instead of applying a fixed percentage to every bundle.
  const targetPrices: Record<string, number> = {
    "Blemish Block Duo": 449,
    "Fullmoon Duo": 449,
    "Velvet Touch Duo": 449,
    "Hair Care Ritual": 999,
    "Fullmoon Complete Routine": 699,
    "Blemish Block Complete Routine": 699,
    "Velvet Touch Complete Routine": 699,
    "Protein Shake Shampoo + Conditioner": 549,
    "Protein Shake Shampoo + Hair Mask": 799,
  };

  return targetPrices[bundleName] ?? Math.round(bundleTotal(products) * 0.9);
}

function bundleDiscountPercent(products: Product[], bundleName: string) {
  const original = bundleTotal(products);
  const finalPrice = bundlePrice(products, bundleName);
  return Math.round(((original - finalPrice) / original) * 100);
}

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
      name: "Protein Shake Shampoo + Conditioner",
      items: [bySlug("repair-shampoo"), bySlug("repair-conditioner")].filter(Boolean) as Product[],
    },
    {
      name: "Protein Shake Shampoo + Hair Mask",
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
            <div className="space-y-2 mb-5">
              {bundle.items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-2 text-sm text-[var(--ink)]/85">
                  {i > 0 && <span className="text-[var(--muted)]">+</span>}
                  <span>{item.name}</span>
                </div>
              ))}
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
