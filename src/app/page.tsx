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
        <div className="grid min-h-[560px] grid-cols-1 md:min-h-[680px] md:grid-cols-3">
          {/* Left: lifestyle / collection panel */}
          <Link href="/collections/skin-care" className="group relative min-h-[470px] overflow-hidden md:min-h-0">
            <img
              src="https://humorluxury.com/wp-content/uploads/2023/10/VHR02812-min-1-new.webp"
              alt="Humor Luxury beauty collection"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04] motion-safe:animate-[humorHeroFloat_9s_ease-in-out_infinite]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#38171c]/75 via-[#38171c]/10 to-transparent" />
            <div className="absolute bottom-10 left-7 z-10 text-white md:left-10 md:bottom-12">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.28em] opacity-90">Premium Beauty</p>
              <h2 className="font-display text-3xl md:text-[42px]">Blemish Block</h2>
              <span className="mt-5 inline-flex bg-[#8f286f] px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-[#a63783]">
                Shop Now
              </span>
            </div>
          </Link>

          {/* Centre: old-site editorial message panel */}
          <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-[#ead8e2] px-7 text-center md:min-h-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.78),transparent_46%)]" />
            <span className="absolute left-[8%] top-[12%] h-10 w-6 rotate-[28deg] rounded-[100%_0] border border-[#b67a96]/35 motion-safe:animate-[humorHeroFloat_6s_ease-in-out_infinite]" />
            <span className="absolute right-[9%] top-[18%] h-14 w-7 rotate-[-32deg] rounded-[100%_0] border border-[#b67a96]/30 motion-safe:animate-[humorHeroFloat_7s_ease-in-out_infinite]" />
            <span className="absolute bottom-[12%] left-[12%] h-16 w-8 rotate-[35deg] rounded-[100%_0] border border-[#b67a96]/30 motion-safe:animate-[humorHeroFloat_8s_ease-in-out_infinite]" />
            <span className="absolute bottom-[10%] right-[12%] h-12 w-6 rotate-[-28deg] rounded-[100%_0] border border-[#b67a96]/30 motion-safe:animate-[humorHeroFloat_7s_ease-in-out_infinite]" />
            <div className="relative z-10 max-w-[360px]">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--deep-wine)]">Best Price</p>
              <h1 className="font-display text-4xl leading-[1.08] text-[var(--deep-wine)] md:text-[48px] lg:text-[52px]">
                Premium Quality<br />Makeup Cosmetics
              </h1>
              <Link href="/shop" className="mt-7 inline-flex bg-[#8f286f] px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-[#a63783]">
                Explore More
              </Link>
              <div className="mt-9 flex justify-center gap-2">
                <span className="h-1.5 w-5 rounded-full bg-[#8f286f]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8899e]/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#b8899e]/60" />
              </div>
            </div>
          </div>

          {/* Right: product panel */}
          <Link href="/product/fullmoon-face-wash" className="group relative min-h-[470px] overflow-hidden bg-[#dfe0ff] md:min-h-0">
            <img
              src="https://humorluxury.com/wp-content/uploads/2023/10/3-new.webp"
              alt="Humor Luxury Fullmoon beauty product"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04] motion-safe:animate-[humorHeroFloat_10s_ease-in-out_infinite]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#7d80ad]/15" />
            <div className="absolute bottom-9 left-0 right-0 text-center opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              <span className="inline-flex bg-[#8f286f] px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg">
                Explore Product
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-3 border-b border-[var(--line)] bg-white py-3.5">
          <span className="h-1.5 w-8 rounded-full bg-[#8f286f]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#c9b3be]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#c9b3be]" />
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
