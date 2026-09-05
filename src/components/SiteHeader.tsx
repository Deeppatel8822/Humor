import Link from "next/link";
import CartBadge from "@/components/CartBadge";

export default function SiteHeader() {
  return (
    <div className="sticky top-0 z-50">

      {/* Top Bar */}
      <div className="bg-[var(--deep-wine)] text-white text-center text-xs py-2 px-4">
        Free shipping on all orders &nbsp;&middot;&nbsp; Dermatologist tested, made in India
      </div>

      {/* Main Header */}
      <header className="bg-white/95 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">

          <div className="flex items-center justify-between h-16 md:h-[72px]">

            {/* Logo */}
            <Link
              href="/"
              className="font-display text-xl md:text-2xl tracking-tight text-[var(--deep-wine)]"
            >
              Humor{" "}
              <span className="text-[var(--warm-gold)] italic">
                Luxury
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-[var(--ink)]">

              <Link
                href="/shop"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Shop
              </Link>

              <Link
                href="/build-your-routine"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Build Your Routine
              </Link>

              <Link
                href="/shop?sort=bestselling"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Best Sellers
              </Link>

              <Link
                href="/bundles"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Bundles
              </Link>

              <Link
                href="/about"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                About
              </Link>

            </nav>

            {/* Search + Cart */}
            <div className="flex items-center gap-1">

              <Link
                href="/search"
                aria-label="Search"
                className="p-2 text-[var(--ink)] hover:text-[var(--deep-wine)] transition-colors"
              >
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
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
