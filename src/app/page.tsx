import Link from "next/link";
import RoutineThread from "@/components/RoutineThread";
import ProductCard from "@/components/ProductCard";
import { getAllProducts } from "@/lib/catalog";

const usps = [
  "Dermatologist Tested",
  "Paraben Free",
  "Sulphate Free",
  "Cruelty Free",
  "Made in India",
  "Premium Ingredients",
];

const brighteningSteps = [
  {
    label: "01 — Cleanse · Fullmoon Face Wash",
    detail: "Gently cleanse your face and prepare the skin for your treatment step.",
  },
  {
    label: "02 — Treat · Fullmoon Face Serum",
    detail: "Apply a few drops to clean, dry skin and let the serum absorb.",
  },
  {
    label: "03 — Protect · Sunscreen SPF 50 PA++++",
    detail: "Finish your morning routine with daily sun protection.",
  },
];

const blemishSteps = [
  {
    label: "01 — Cleanse · Blemish Block Face Wash",
    detail: "Start with a clean face by gently cleansing away daily buildup and excess oil.",
  },
  {
    label: "02 — Treat · Blemish Block Face Serum",
    detail: "Apply a few drops to clean, dry skin as your targeted treatment step.",
  },
  {
    label: "03 — Protect · Sunscreen SPF 50 PA++++",
    detail: "Complete your morning routine with daily sun protection.",
  },
];

export default async function Home() {
  const allProducts = await getAllProducts();
  const bestSellers = allProducts.filter((p) => p.is_bestseller).slice(0, 4);
  const skincare = allProducts.filter((p) => p.category === "skincare").slice(0, 4);
  const haircare = allProducts.filter((p) => p.category === "haircare").slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-14 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-4">
            Clean Beauty, Seriously Formulated
          </p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05] text-[var(--deep-wine)]">
            Beauty that feels like <em className="italic text-[var(--dusty-rose)]">you.</em>
          </h1>
          <p className="mt-6 text-base md:text-lg text-[var(--ink)]/75 max-w-md">
            Thoughtfully created skincare, haircare and bodycare for your everyday beauty ritual, dermatologist tested, made in India.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/shop" className="bg-[var(--deep-wine)] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--ink)] transition-colors">
              Shop All
            </Link>
            <Link href="/build-your-routine" className="border border-[var(--line)] text-[var(--deep-wine)] px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--milk-sage)] transition-colors">
              Build Your Routine
            </Link>
          </div>
        </div>

        <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-[var(--dusty-rose)]/25 via-[var(--milk-sage)] to-[var(--warm-gold)]/15 border border-[var(--line)] flex items-center justify-center">
          <span className="font-display text-sm text-[var(--deep-wine)]/30 px-8 text-center">
            Hero photography goes here — model or hero product shot
          </span>
        </div>
      </section>

      {/* USP strip */}
      <section className="border-y border-[var(--line)] bg-[var(--milk-sage)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 flex flex-wrap justify-center gap-x-10 gap-y-3">
          {usps.map((u) => (
            <span key={u} className="text-xs md:text-sm uppercase tracking-wider text-[var(--deep-wine)] font-medium">
              {u}
            </span>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Best Sellers</h2>
          <Link href="/shop?sort=bestselling" className="text-sm text-[var(--warm-gold)] font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Shop by Routine */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-3">Simple. Intentional. Effective.</p>
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-3">Shop by Routine</h2>
          <p className="text-[var(--muted)] max-w-xl">
            The right products in the right order can turn your daily skincare into a simple, consistent ritual.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          <RoutineThread title="Brightening Routine" steps={brighteningSteps} />
          <RoutineThread title="Acne & Blemish Routine" steps={blemishSteps} />
        </div>

        <div className="mt-10">
          <Link href="/build-your-routine" className="inline-block border border-[var(--deep-wine)] text-[var(--deep-wine)] px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--milk-sage)] transition-colors">
            Build Your Routine &rarr;
          </Link>
        </div>
      </section>

      {/* Skincare collection preview */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Skin Care</h2>
          <Link href="/collections/skin-care" className="text-sm text-[var(--warm-gold)] font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {skincare.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Haircare collection preview */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Hair Care</h2>
          <Link href="/collections/hair-care" className="text-sm text-[var(--warm-gold)] font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {haircare.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Trust facts */}
      <section className="bg-[var(--milk-sage)] border-y border-[var(--line)] py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div><div className="font-display text-2xl text-[var(--deep-wine)] mb-1">11</div><div className="text-xs text-[var(--muted)] uppercase tracking-wide">Products, 3 Categories</div></div>
          <div><div className="font-display text-2xl text-[var(--deep-wine)] mb-1">100%</div><div className="text-xs text-[var(--muted)] uppercase tracking-wide">Cruelty Free</div></div>
          <div><div className="font-display text-2xl text-[var(--deep-wine)] mb-1">0</div><div className="text-xs text-[var(--muted)] uppercase tracking-wide">Parabens / Sulphates</div></div>
          <div><div className="font-display text-2xl text-[var(--deep-wine)] mb-1">India</div><div className="text-xs text-[var(--muted)] uppercase tracking-wide">Proudly Made In</div></div>
        </div>
      </section>
    </>
  );
}
