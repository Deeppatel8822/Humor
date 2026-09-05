import Link from "next/link";
import CartBadge from "@/components/CartBadge";

const skinCare = ["Fullmoon", "Blemish Block", "Velvet Touch", "Sunscreen"];
const hairCare = ["Shampoo", "Conditioner", "Hair Mask"];

export default function SiteHeader() {
  return (
    <div className="sticky top-0 z-50">
      <div className="bg-[var(--deep-wine)] text-white text-center text-xs py-2 px-4">
        Free shipping on eligible orders &nbsp;&middot;&nbsp; Dermatologist tested, made in India
      </div>
      <header className="bg-white/95 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            <Link href="/" className="font-display text-xl md:text-2xl tracking-tight text-[var(--deep-wine)]">
              Humor <span className="text-[var(--warm-gold)] italic">Luxury</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-[var(--ink)]">
              <div className="group relative py-6 -my-6">
                <button className="hover:text-[var(--deep-wine)]">Shop</button>
                <div className="absolute left-0 top-full hidden group-hover:flex bg-white shadow-lg border border-[var(--line)] rounded-lg py-5 px-6 gap-10">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-2">Skin Care</div>
                    <div className="flex flex-col gap-1.5 min-w-36">
                      {skinCare.map((s) => (
                        <Link key={s} href={`/collections/skin-care?range=${encodeURIComponent(s)}#products`} className="block rounded-md px-3 py-2 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--milk-sage)] hover:text-[var(--deep-wine)]">
                          {s}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-2">Hair Care</div>
                    <div className="flex flex-col gap-1.5 min-w-36">
                      {hairCare.map((h) => (
                        <Link key={h} href={`/collections/hair-care?type=${encodeURIComponent(h)}`} className="text-sm hover:text-[var(--deep-wine)]">
                          {h}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-2">Body Care</div>
                    <div className="flex flex-col gap-1.5 min-w-36">
                      <Link href="/collections/body-care" className="text-sm hover:text-[var(--deep-wine)]">Shower Gel</Link>
                    </div>
                    <Link href="/shop" className="inline-block mt-4 text-sm font-medium text-[var(--deep-wine)] underline">
                      All Products
                    </Link>
                  </div>
                </div>
              </div>
              <Link href="/shop?sort=bestselling" className="hover:text-[var(--deep-wine)]">Shop by Concern</Link>
              <Link href="/build-your-routine" className="hover:text-[var(--deep-wine)]">Build Your Routine</Link>
              <Link href="/shop?sort=bestselling" className="hover:text-[var(--deep-wine)]">Best Sellers</Link>
              <Link href="/bundles" className="hover:text-[var(--deep-wine)]">Bundles</Link>
              <Link href="/journal" className="hover:text-[var(--deep-wine)]">Journal</Link>
              <Link href="/about" className="hover:text-[var(--deep-wine)]">About</Link>
            </nav>

            <div className="flex items-center gap-1">
              <Link href="/search" aria-label="Search" className="p-2 text-[var(--ink)] hover:text-[var(--deep-wine)]">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </Link>
              <CartBadge />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
