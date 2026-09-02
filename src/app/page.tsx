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

const concerns = [
  { name: "Acne", color: "bg-[var(--moss)]" },
  { name: "Dry Skin", color: "bg-[var(--dusty-rose)]" },
  { name: "Oily Skin", color: "bg-[var(--warm-gold)]" },
  { name: "Pigmentation", color: "bg-[var(--deep-wine)]" },
  { name: "Sun Protection", color: "bg-[var(--wine-soft)]" },
  { name: "Hair Care", color: "bg-[var(--moss)]" },
];

const morningSteps = [
  { label: "Cleanse", detail: "Gentle face wash to remove overnight buildup" },
  { label: "Treat", detail: "Vitamin C serum for brightening" },
  { label: "Protect", detail: "Lightweight SPF, non-greasy finish" },
];

const nightSteps = [
  { label: "Double Cleanse", detail: "Oil cleanse, then foam cleanse" },
  { label: "Repair", detail: "Niacinamide serum for barrier repair" },
  { label: "Lock In", detail: "Rich night cream to seal moisture" },
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
            Thoughtfully created skincare, haircare and bodycare for your everyday beauty ritual —
            dermatologist tested, made in India.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/collections/skin-care"
              className="bg-[var(--deep-wine)] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--ink)] transition-colors"
            >
              Shop Skincare
            </Link>
            <Link
              href="/collections/hair-care"
              className="border border-[var(--line)] text-[var(--deep-wine)] px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--milk-sage)] transition-colors"
            >
              Shop Haircare
            </Link>
          </div>
        </div>
        <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-[var(--dusty-rose)]/25 via-[var(--milk-sage)] to-[var(--warm-gold)]/15 border border-[var(--line)] flex items-center justify-center">
          <span className="font-display text-sm text-[var(--deep-wine)]/30 px-8 text-center">
            Hero photography goes here — model or hero product shot
          </span>
        </div>
      </section>

      {/* USP strip — only claims that are actually true of the formulas */}
      <section className="border-y border-[var(--line)] bg-[var(--milk-sage)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 flex flex-wrap justify-center gap-x-10 gap-y-3">
          {usps.map((u) => (
            <span key={u} className="text-xs md:text-sm uppercase tracking-wider text-[var(--deep-wine)] font-medium">
              {u}
            </span>
          ))}
        </div>
      </section>

      {/* Shop by Concern */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-10">Shop by Concern</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {concerns.map((c) => (
            <Link
              key={c.name}
              href={`/shop?concern=${encodeURIComponent(c.name)}`}
              className="group relative aspect-square rounded-2xl overflow-hidden flex items-end p-4"
            >
              <div className={`absolute inset-0 ${c.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <span className="relative text-white font-medium text-sm">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers — real catalog data */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Best Sellers</h2>
          <Link href="/shop?sort=bestselling" className="text-sm text-[var(--warm-gold)] font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Build Your Routine teaser */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-2">Shop by Routine</h2>
        <p className="text-[var(--muted)] mb-12 max-w-xl">
          Three products, done in order, matter more than ten used at random.
        </p>
        <div className="grid md:grid-cols-2 gap-16">
          <RoutineThread title="Morning Routine" steps={morningSteps} />
          <RoutineThread title="Night Routine" steps={nightSteps} />
        </div>
        <Link
          href="/build-your-routine"
          className="inline-block mt-10 border border-[var(--deep-wine)] text-[var(--deep-wine)] px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--milk-sage)] transition-colors"
        >
          Build Your Routine &rarr;
        </Link>
      </section>

      {/* Skincare collection preview */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Skin Care</h2>
          <Link href="/collections/skin-care" className="text-sm text-[var(--warm-gold)] font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {skincare.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Haircare collection preview */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Hair Care</h2>
          <Link href="/collections/hair-care" className="text-sm text-[var(--warm-gold)] font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {haircare.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Trust facts — only what's actually true of the brand/formulas, no invented numbers */}
      <section className="bg-[var(--milk-sage)] border-y border-[var(--line)] py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="font-display text-2xl text-[var(--deep-wine)] mb-1">11</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide">Products, 3 Categories</div>
          </div>
          <div>
            <div className="font-display text-2xl text-[var(--deep-wine)] mb-1">100%</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide">Cruelty Free</div>
          </div>
          <div>
            <div className="font-display text-2xl text-[var(--deep-wine)] mb-1">0</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide">Parabens / Sulphates</div>
          </div>
          <div>
            <div className="font-display text-2xl text-[var(--deep-wine)] mb-1">India</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wide">Proudly Made In</div>
          </div>
        </div>
      </section>
    </>
  );
}
