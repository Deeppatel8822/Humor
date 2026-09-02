import { getByCategory } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "Skin Care | Humor Luxury",
  description: "Fullmoon, Blemish Block, Velvet Touch, and Sunscreen — Humor Luxury's skincare range.",
};

const subranges = ["Fullmoon", "Blemish Block", "Velvet Touch"];

export default async function SkinCarePage() {
  const products = await getByCategory("skincare");

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
      <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-2">Skin Care</h1>
      <p className="text-[var(--muted)] mb-10">{products.length} products across our three skincare ranges</p>

      {subranges.map((range) => {
        const items = products.filter((p) => p.subrange === range);
        if (items.length === 0) return null;
        return (
          <div key={range} className="mb-16">
            <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-5">{range}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        );
      })}

      {products.filter((p) => !p.subrange).length > 0 && (
        <div>
          <h2 className="font-display text-2xl text-[var(--deep-wine)] mb-5">Sun Care</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.filter((p) => !p.subrange).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
