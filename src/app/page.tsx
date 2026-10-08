import Link from "next/link";
import RoutineThread from "@/components/RoutineThread";
import ProductCard from "@/components/ProductCard";
import HeroSlider from "@/components/HeroSlider";
import SocialReels from "@/components/SocialReels";
import { getAllProducts } from "@/lib/catalog";
import TrustFacts from "@/components/TrustFacts";

const usps = [
  { label: "Dermatologically Tested", symbol: "✓" },
  { label: "Paraben Free", symbol: "◌" },
  { label: "Sulphate Free", symbol: "⚗" },
  { label: "Cruelty Free", symbol: "♡" },
  { label: "Made in India", symbol: "✦" },
  { label: "Premium Ingredients", symbol: "◇" },
];

const brighteningSteps = [
  { label: "01 — Cleanse · Fullmoon Face Wash", detail: "Gently cleanse your face and prepare the skin for your treatment step." },
  { label: "02 — Treat · Fullmoon Face Serum", detail: "Apply a few drops to clean, dry skin and let the serum absorb." },
  { label: "03 — Protect · Sunscreen SPF 50 PA++++", detail: "Finish your morning routine with daily sun protection." },
];

const blemishSteps = [
  { label: "01 — Cleanse · Blemish Block Face Wash", detail: "Start with a clean face by gently cleansing away daily buildup and excess oil." },
  { label: "02 — Treat · Blemish Block Face Serum", detail: "Apply a few drops to clean, dry skin as your targeted treatment step." },
  { label: "03 — Protect · Sunscreen SPF 50 PA++++", detail: "Complete your morning routine with daily sun protection." },
];

export default async function Home() {
  const allProducts = await getAllProducts();
  const bestSellers = allProducts.filter((p) => p.is_bestseller).slice(0, 4);
  const skincare = allProducts.filter((p) => p.category === "skincare").slice(0, 4);
  const haircare = allProducts.filter((p) => p.category === "haircare").slice(0, 3);

  return (
    <>
      <HeroSlider />

      <section className="border-y border-[var(--line)] bg-[#f7f2fb]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-5 md:py-6 flex flex-wrap justify-center gap-x-7 gap-y-4 md:gap-x-10">
          {usps.map((usp) => (
            <div key={usp.label} className="flex items-center gap-2.5 text-[var(--deep-wine)]">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--deep-wine)]/30 bg-white/70 text-base font-semibold">{usp.symbol}</span>
              <span className="text-[11px] md:text-xs uppercase tracking-[0.13em] font-medium whitespace-nowrap">{usp.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Best Sellers</h2>
          <Link href="/shop?sort=bestselling" className="text-sm text-[var(--warm-gold)] font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-3">Simple. Intentional. Effective.</p>
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-3">Shop by Routine</h2>
          <p className="text-[var(--muted)] max-w-xl">The right products in the right order can turn your daily skincare into a simple, consistent ritual.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-16">
          <RoutineThread title="Brightening Routine" steps={brighteningSteps} />
          <RoutineThread title="Acne & Blemish Routine" steps={blemishSteps} />
        </div>
        <div className="mt-10"><Link href="/build-your-routine" className="inline-block border border-[var(--deep-wine)] text-[var(--deep-wine)] px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--milk-sage)] transition-colors">Build Your Routine &rarr;</Link></div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Skin Care</h2>
          <Link href="/collections/skin-care" className="text-sm text-[var(--warm-gold)] font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{skincare.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Hair Care</h2>
          <Link href="/collections/hair-care" className="text-sm text-[var(--warm-gold)] font-medium">View All &rarr;</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">{haircare.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </section>

      <SocialReels />
      <TrustFacts />
    </>
  );
}
