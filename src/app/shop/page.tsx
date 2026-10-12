import { getAllProducts } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

const productFilters = [
  { label: "All", value: "" },
  { label: "Face Wash", value: "face-wash" },
  { label: "Face Serum", value: "face-serum" },
  { label: "Shampoo", value: "shampoo" },
  { label: "Conditioner & Mask", value: "conditioner-mask" },
  { label: "Shower", value: "shower" },
  { label: "Sunscreen", value: "sunscreen" },
];

function matchesCategory(product: { slug: string; name: string }, category: string) {
  const value = `${product.slug} ${product.name}`.toLowerCase();
  switch (category) {
    case "face-wash":
      return /face[- ]?(wash|cleanser)|face wash/.test(value);
    case "face-serum":
      return /serum/.test(value);
    case "shampoo":
      return /shampoo/.test(value);
    case "conditioner-mask":
      return /conditioner|hair[- ]?mask|repairing smooth hair mask/.test(value);
    case "shower":
      return /shower|body wash|shower gel/.test(value);
    case "sunscreen":
      return /sunscreen|sun[- ]?screen|spf/.test(value);
    default:
      return true;
  }
}

export const metadata = {
  title: "Shop",
  description:
    "Shop Humor Luxury face washes, face serums, sunscreen, shampoos, conditioners and body care. Find everyday skincare and haircare essentials for your routine.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;
  let items = await getAllProducts();

  if (category) {
    items = items.filter((p) => matchesCategory(p, category));
  }

  switch (sort) {
    case "price-asc":
      items = [...items].sort((a, b) => a.price_inr - b.price_inr);
      break;
    case "price-desc":
      items = [...items].sort((a, b) => b.price_inr - a.price_inr);
      break;
    case "name-asc":
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      items = [...items].sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "newest":
      items = [...items].sort(
        (a, b) => Number(b.is_new) - Number(a.is_new) || b.id.localeCompare(a.id, undefined, { numeric: true })
      );
      break;
    case "bestselling":
      items = [...items].sort(
        (a, b) => Number(b.is_bestseller) - Number(a.is_bestseller)
      );
      break;
    default:
      items = [...items].sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured) ||
          Number(b.is_bestseller) - Number(a.is_bestseller)
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
      <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-2">
        {category
          ? productFilters.find((f) => f.value === category)?.label ?? "Shop"
          : "Find Your Perfect Care"}
      </h1>

      <p className="text-[var(--muted)] mb-8">
        Explore everyday skincare and haircare essentials for your routine.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap gap-2">
          {productFilters.map((filter) => (
            <a
              key={filter.value || "all"}
              href={filter.value ? `/shop?category=${filter.value}#products` : "/shop#products"}
              className={`px-4 py-2 rounded-full text-xs font-medium border ${
                (category ?? "") === filter.value
                  ? "bg-[var(--deep-wine)] text-white border-[var(--deep-wine)]"
                  : "border-[var(--line)] text-[var(--deep-wine)]"
              }`}
            >
              {filter.label}
            </a>
          ))}
        </div>

        <form method="get" className="flex items-center gap-2" action="/shop">
          {category && <input type="hidden" name="category" value={category} />}
          <label htmlFor="sort" className="text-xs text-[var(--muted)]">
            Sort by
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort ?? ""}
            onChange={undefined}
            className="text-xs border border-[var(--line)] rounded-full px-3 py-2 bg-[var(--milk-sage)] text-[var(--deep-wine)]"
          >
            <option value="">Featured</option>
            <option value="bestselling">Best Selling</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
            <option value="newest">Newest First</option>
          </select>
          <button type="submit" className="px-3 py-2 rounded-full text-xs border border-[var(--line)] text-[var(--deep-wine)]">
            Apply
          </button>
        </form>
      </div>

      <div id="products" className="scroll-mt-24">
        {items.length === 0 ? (
          <p className="text-[var(--muted)]">
            No products found in this category yet.
          </p>
        ) : (
          <>
            <p className="text-xs text-[var(--muted)] mb-5">
              {items.length} {items.length === 1 ? "product" : "products"} found
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
