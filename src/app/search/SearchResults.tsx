"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";

function normalize(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function SearchResults({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q");
    if (initialQuery) setQuery(initialQuery);
  }, []);

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return [];
    return products.filter((product) => {
      const searchable = [
        product.name, product.slug, product.tagline ?? "", product.description,
        product.category, product.subrange ?? "", ...(product.skin_hair_type ?? []),
        ...(product.concern_tags ?? []), ...(product.key_benefits ?? []),
        ...(product.key_ingredients ?? []).map((ingredient) => ingredient.name),
      ].map((value) => normalize(String(value))).join(" ");
      return searchable.includes(term) || term.includes(normalize(product.name));
    });
  }, [query, products]);

  return (
    <main className="min-h-[65vh] bg-[#FCFAFD] px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-[#A47A55]">HUMOR LUXURY</p>
        <h1 className="mt-2 text-center font-display text-3xl text-[#35243F] sm:text-4xl">Find your favourites</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#776981]">Search skincare, haircare and your everyday essentials.</p>
        <form className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-full border border-[#E5D9EB] bg-white p-2 shadow-sm" onSubmit={(event) => event.preventDefault()}>
          <svg className="ml-3 shrink-0 text-[#806A8D]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search face wash, serum, shampoo..." aria-label="Search products" className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-[#35243F] outline-none placeholder:text-[#A99BAF]" />
          {query && <button type="button" onClick={() => setQuery("")} className="rounded-full px-3 py-2 text-xs text-[#7047A0] hover:bg-[#F7F1FA]">Clear</button>}
        </form>
        {!query.trim() ? (
          <div className="mt-10 text-center">
            <p className="text-sm text-[#776981]">Popular searches</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["Face Wash", "Facewash", "Serum", "Sunscreen", "Shampoo", "Hair Mask"].map((term) => <button key={term} type="button" onClick={() => setQuery(term)} className="rounded-full border border-[#E5D9EB] bg-white px-4 py-2 text-xs text-[#604B6D] transition hover:border-[#7047A0] hover:bg-[#F7F1FA]">{term}</button>)}
            </div>
          </div>
        ) : (
          <section className="mt-10">
            <p className="mb-5 text-sm text-[#776981]">{results.length} {results.length === 1 ? "product" : "products"} found for “{query}”</p>
            {results.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {results.map((product) => (
                  <Link key={product.id} href={`/product/${product.slug}`} className="group overflow-hidden rounded-2xl border border-[#EEE5F2] bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#F8F4FA] p-3">
                      {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="text-center font-display text-lg text-[#7047A0]">HUMOR<br />LUXURY</span>}
                    </div>
                    <h2 className="mt-3 line-clamp-2 text-sm font-medium text-[#35243F] group-hover:text-[#7047A0]">{product.name}</h2>
                    <p className="mt-1 line-clamp-2 text-xs text-[#8B7D92]">{product.tagline}</p>
                    <p className="mt-3 text-sm font-semibold text-[#50336F]">₹{product.price_inr.toLocaleString("en-IN")}</p>
                  </Link>
                ))}
              </div>
            ) : <div className="rounded-2xl border border-[#EEE5F2] bg-white px-5 py-12 text-center"><p className="font-display text-xl text-[#35243F]">No matches just yet</p><p className="mt-2 text-sm text-[#776981]">Try a different product name or browse our collection.</p><Link href="/shop" className="mt-5 inline-flex rounded-full bg-[#7047A0] px-6 py-3 text-sm font-semibold text-white">Explore the collection</Link></div>}
          </section>
        )}
      </div>
    </main>
  );
}
