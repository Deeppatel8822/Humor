import { getByCategory } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "Skin Care | Humor Luxury",
  description:
    "Explore Humor Luxury skincare ranges including Fullmoon, Blemish Block, Velvet Touch, and Sunscreen.",
};

const subranges = ["Fullmoon", "Blemish Block", "Velvet Touch"];

export default async function SkinCarePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const products = await getByCategory("skincare");

  const filteredProducts = range
    ? products.filter(
        (p) =>
          p.subrange === range ||
          (range === "Sunscreen" && !p.subrange)
      )
    : products;

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
      <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-2">
        {range ? range : "Skin Care"}
      </h1>

      <p className="text-[var(--muted)] mb-10">
        {range
          ? `Explore our ${range.toLowerCase()} skincare range.`
          : `${products.length} products across our skincare ranges.`}
      </p>

      <div
        id="products"
        className="grid grid-cols-2 md:grid-cols-4 gap-6 scroll-mt-24"
      >
        {filteredProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-[var(--muted)]">
          No products found in this range.
        </p>
      )}
    </div>
  );
}
