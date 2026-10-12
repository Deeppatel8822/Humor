import { getByCategory } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "Body Care",
  description: "Explore Humor Luxury body care and Royal Water Soft Shower Cream for a refreshing everyday cleansing routine.",
  alternates: { canonical: "/collections/body-care" },
};

export default async function BodyCarePage() {
  const products = await getByCategory("bodycare");

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-14">
      <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-2">Body Care</h1>
      <p className="text-[var(--muted)] mb-10">{products.length} products</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
