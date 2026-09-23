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
      <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--milk-sage)]">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[var(--dusty-rose)]/15 blur-2xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[var(--warm-gold)]/10 blur-2xl" />
        <div className="relative mx-auto max-w-[1500px] px-5 md:px-10">
          <div className="relative min-h-[560px] md:min-h-[590px]">
            {[
              { eyebrow: "Premium Everyday Beauty", title: "Beauty that feels like you.", copy: "Thoughtfully created skincare, haircare and bodycare for your everyday ritual.", image: "/products/sunscreen-lifestyle.webp", imageAlt: "Humor Luxury sunscreen lifestyle" },
              { eyebrow: "Dermatologist Tested", title: "Your routine, beautifully simple.", copy: "Clean, considered formulas made in India for the rituals you actually keep.", image: "/products/protein-shake-shampoo-main.webp", imageAlt: "Humor Luxury Protein Shake Shampoo" },
              { eyebrow: "Targeted Skincare", title: "Care made for your skin.", copy: "Build a routine around cleansing, treating and protecting your skin every day.", image: "/products/blemish-block-face-serum-main.webp", imageAlt: "Humor Luxury Blemish Block Face Serum" },
            ].map((slide) => (
              <div key={slide.title} className="humor-hero-slide absolute inset-0 flex items-center opacity-0">
                <div className="grid w-full items-center gap-8 py-14 md:grid-cols-[1fr_0.9fr] md:gap-12 md:py-16">
                  <div className="relative z-10 max-w-2xl">
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--warm-gold)] md:text-xs">{slide.eyebrow}</p>
                    <h1 className="font-display text-5xl leading-[0.98] text-[var(--deep-wine)] md:text-7xl lg:text-[82px]">{slide.title}</h1>
                    <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--ink)]/70 md:text-base">{slide.copy}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link href="/shop" className="rounded-full bg-[var(--deep-wine)] px-7 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]">Shop Now</Link>
                      <Link href="/build-your-routine" className="rounded-full border border-[var(--deep-wine)]/25 bg-white/60 px-7 py-3.5 text-sm font-medium text-[var(--deep-wine)] backdrop-blur transition-colors hover:bg-white">Build Your Routine</Link>
                    </div>
                    <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] md:text-xs">
                      <span>Made in India</span><span>Dermatologist Tested</span><span>Cruelty Free</span>
                    </div>
                  </div>
                  <div className="relative flex min-h-[330px] items-center justify-center md:min-h-[500px]">
                    <div className="absolute h-[290px] w-[290px] rounded-full border border-[var(--warm-gold)]/25 bg-white/55 md:h-[420px] md:w-[420px]" />
                    <div className="absolute h-[235px] w-[235px] rounded-full border border-[var(--dusty-rose)]/25 md:h-[350px] md:w-[350px]" />
                    <span className="absolute right-[8%] top-[12%] h-3 w-3 rounded-full bg-[var(--warm-gold)]/60" />
                    <span className="absolute bottom-[15%] left-[10%] h-2 w-2 rounded-full bg-[var(--dusty-rose)]/70" />
                    <img src={slide.image} alt={slide.imageAlt} className="humor-hero-product relative z-10 max-h-[330px] w-auto max-w-[78%] object-contain drop-shadow-[0_24px_30px_rgba(74,31,43,0.16)] md:max-h-[460px] md:max-w-[82%]" />
                    <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--deep-wine)] shadow-sm backdrop-blur">Humor Luxury</div>
                  </div>
                </div>
              </div>
            ))}
            <div className="absolute bottom-7 left-0 flex items-center gap-2 md:bottom-10">
              <span className="h-px w-10 bg-[var(--deep-wine)]" /><span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">01 · 03</span>
            </div>
          </div>
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
