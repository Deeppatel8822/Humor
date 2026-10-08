import Link from "next/link";
import RoutineThread from "@/components/RoutineThread";
import ProductCard from "@/components/ProductCard";
import HeroSlider from "@/components/HeroSlider";
import SocialReels from "@/components/SocialReels";
import { getAllProducts } from "@/lib/catalog";

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

      <section className="border-y border-[var(--line)] bg-[#f7f2fb] overflow-hidden" aria-label="Why choose Humor Luxury">
        <div className="usp-marquee py-3.5 md:py-4">
          <div className="usp-marquee-track">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="usp-marquee-group"
                aria-hidden={copy === 1 ? "true" : undefined}
              >
                {usps.map((usp) => (
                  <div key={copy + "-" + usp.label} className="flex shrink-0 items-center gap-2.5 text-[var(--deep-wine)]">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--deep-wine)]/25 bg-white/70 text-sm font-semibold"
                    >
                      {usp.symbol}
                    </span>
                    <span className="text-[10px] md:text-[11px] uppercase tracking-[0.11em] font-medium whitespace-nowrap">
                      {usp.label}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
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

      <section className="max-w-7xl mx-auto px-5 md:px-8 pb-12 pt-2">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="group rounded-[1.5rem] border border-[var(--line)] bg-[var(--milk-sage)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(111,74,154,0.10)]">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--deep-wine)] shadow-sm">
              <span aria-hidden="true" className="text-lg">🚚</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--warm-gold)]">Easy Shopping</p>
            <h3 className="mt-2 font-display text-2xl text-[var(--deep-wine)]">Shipping &amp; COD Available</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Convenient delivery options with Cash on Delivery available at checkout.</p>
          </div>

          <div className="group rounded-[1.5rem] border border-[var(--line)] bg-[var(--milk-sage)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(111,74,154,0.10)]">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--deep-wine)] shadow-sm">
              <span aria-hidden="true" className="text-lg">✦</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--warm-gold)]">Beauty Perks</p>
            <h3 className="mt-2 font-display text-2xl text-[var(--deep-wine)]">Exciting Offers &amp; Discounts</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Discover special offers, seasonal savings and exclusive deals across Humor.</p>
          </div>

          <div className="group rounded-[1.5rem] border border-[var(--line)] bg-[var(--milk-sage)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(111,74,154,0.10)]">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--deep-wine)] shadow-sm">
              <span aria-hidden="true" className="text-lg">♡</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--warm-gold)]">Welcome Gift</p>
            <h3 className="mt-2 font-display text-2xl text-[var(--deep-wine)]">Sign Up &amp; Get a Discount</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Create your account and unlock your welcome discount for your first order.</p>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-8 pb-10 pt-2">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--velvet-gradient-soft)] shadow-[0_18px_60px_rgba(111,74,154,0.12)]">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/60 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[var(--dusty-rose)]/15 blur-3xl" aria-hidden="true" />
          <div className="relative grid items-center gap-7 px-6 py-9 md:grid-cols-[1fr_auto] md:px-12 md:py-10">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--deep-wine)]/15 bg-white/70 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--deep-wine)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--warm-gold)]" aria-hidden="true" />
                HUMOR BUSINESS PROGRAMME
              </div>
              <h2 className="font-display text-3xl leading-tight text-[var(--ink)] md:text-5xl">
                Start Your Beauty Business for Just ₹9.
              </h2>
              <p className="mt-3 text-lg font-semibold text-[var(--wine-soft)] md:text-xl">
                Register in 2 Minutes. Start Selling. Start Earning.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] md:text-base">
                Are you an influencer, salon or parlour owner, or running a beauty business from home?
                Join Humor and turn your beauty audience into an income opportunity.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[var(--deep-wine)] px-4 py-2 text-xs font-semibold text-white shadow-sm">₹9 to Get Started</span>
                <span className="text-xs font-semibold text-[var(--wine-soft)]">No Hidden Charges</span>
              </div>
            </div>
            <div className="flex md:justify-end">
              <Link href="/your-business" className="group inline-flex min-w-[170px] items-center justify-center gap-2 rounded-full bg-[var(--deep-wine)] px-7 py-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(111,74,154,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[var(--wine-soft)]">
                START HERE <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
