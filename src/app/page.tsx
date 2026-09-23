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
      <section className="relative overflow-hidden bg-white">
        <div className="grid min-h-[620px] grid-cols-1 md:min-h-[720px] md:grid-cols-3">
          <Link href="/collections/skin-care" className="group relative min-h-[430px] overflow-hidden bg-[#4b2428] md:min-h-0">
            <img src="https://humorluxury.com/wp-content/uploads/2023/10/VHR02812-min-1-new.webp" alt="Humor Luxury skincare" className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 bg-[var(--deep-wine)]/15 transition-colors duration-500 group-hover:bg-[var(--deep-wine)]/5" />
            <div className="absolute bottom-10 left-8 z-10 text-white md:left-10">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.28em]">Skincare</p>
              <h2 className="font-display text-3xl md:text-4xl">Blemish Block</h2>
              <span className="mt-5 inline-flex bg-[#8f286f] px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] transition-transform duration-300 group-hover:translate-x-1">Shop Now</span>
            </div>
          </Link>

          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-[#ead7e2] px-8 text-center md:min-h-0">
            <div className="absolute -left-8 top-4 h-20 w-28 rotate-12 rounded-full bg-white/30 blur-xl" />
            <div className="absolute bottom-5 left-4 h-16 w-24 -rotate-12 rounded-full bg-[#e8a1b5]/40 blur-lg" />
            <div className="absolute bottom-5 right-5 h-16 w-24 rotate-12 rounded-full bg-[#e8a1b5]/35 blur-lg" />
            <div className="relative z-10">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--deep-wine)]">Best Price</p>
              <h1 className="font-display text-4xl leading-tight text-[var(--deep-wine)] md:text-5xl lg:text-[52px]">Premium Quality<br />Beauty Cosmetics</h1>
              <Link href="/shop" className="mt-7 inline-flex bg-[#8f286f] px-8 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-transform duration-300 hover:scale-105">Explore More</Link>
            </div>
          </div>

          <Link href="/product/fullmoon-face-wash" className="group relative min-h-[430px] overflow-hidden bg-[#dfe0ff] md:min-h-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9),_rgba(220,222,255,0.7)_48%,_rgba(203,207,247,0.95))]" />
            <div className="absolute inset-0 opacity-80">
              <span className="absolute left-5 top-8 h-20 w-32 rotate-45 border-l border-t border-[#7f88ad]/30" />
              <span className="absolute bottom-8 right-4 h-24 w-36 -rotate-45 border-r border-b border-[#7f88ad]/30" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/products/fullmoon-face-wash-main.webp" alt="Humor Luxury Fullmoon Face Wash" className="relative z-10 max-h-[72%] max-w-[68%] object-contain drop-shadow-[0_24px_28px_rgba(55,55,80,0.22)] transition-transform duration-700 group-hover:scale-105" />
            </div>
          </Link>
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
