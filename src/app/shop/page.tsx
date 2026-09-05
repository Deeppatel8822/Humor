import { getAllProducts } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

const concernFilters = [
  "Acne",
  "Dry Skin",
  "Oily Skin",
  "Pigmentation",
  "Hair Care",
  "Sun Protection",
];

export const metadata = {
  title: "Shop by Concern | Humor Luxury",
  description:
    "Find the right skincare and haircare products for your skin and hair concerns.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ concern?: string; sort?: string }>;
}) {
  const { concern, sort } = await searchParams;
  let items = await getAllProducts();

  if (concern) {
    items = items.filter((p) => p.concern_tags.includes(concern));
  }

  if (sort === "price-asc") {
    items = [...items].sort((a, b) => a.price_inr - b.price_inr);
  }

  if (sort === "price-desc") {
    items = [...items].sort((a, b) => b.price_inr - a.price_inr);
  }

  if (sort === "bestselling") {
    items = [...items].sort(
      (a, b) => Number(b.is_bestseller) - Number(a.is_bestseller)
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
      <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-2">
        {concern ? concern : "Find Your Perfect Care"}
      </h1>

      <p className="text-[var(--muted)] mb-8">
        {concern
          ? `Explore products selected for ${concern.toLowerCase()}.`
          : "Choose your skin or hair concern and discover products made for your routine."}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap gap-2">
          <a
            href="/shop#products"
            className={`px-4 py-2 rounded-full text-xs font-medium border ${
              !concern
                ? "bg-[var(--deep-wine)] text-white border-[var(--deep-wine)]"
                : "border-[var(--line)] text-[var(--deep-wine)]"
            }`}
          >
            All Concerns
          </a>

          {concernFilters.map((c) => (
            <a
              key={c}
              href={`/shop?concern=${encodeURIComponent(c)}#products`}
              className={`px-4 py-2 rounded-full text-xs font-medium border ${
                concern === c
                  ? "bg-[var(--deep-wine)] text-white border-[var(--deep-wine)]"
                  : "border-[var(--line)] text-[var(--deep-wine)]"
              }`}
            >
              {c}
            </a>
          ))}
        </div>

        <form
          method="get"
          className="flex items-center gap-2"
          action="/shop"
        >
          {concern && (
            <input type="hidden" name="concern" value={concern} />
          )}

          <label
            htmlFor="sort"
            className="text-xs text-[var(--muted)]"
          >
            Sort by
          </label>

          <select
            id="sort"
            name="sort"
            defaultValue={sort ?? ""}
            className="text-xs border border-[var(--line)] rounded-full px-3 py-2 bg-[var(--milk-sage)] text-[var(--deep-wine)]"
          >
            <option value="">Featured</option>
            <option value="bestselling">Best Selling</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </form>
      </div>

      <div id="products" className="scroll-mt-24">
        {items.length === 0 ? (
          <p className="text-[var(--muted)]">
            No products match this concern yet.
          </p>
        ) : (
          <>
            <p className="text-xs text-[var(--muted)] mb-5">
              {items.length}{" "}
              {items.length === 1 ? "product" : "products"} found
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
