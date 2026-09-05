import Link from "next/link";
import CartBadge from "@/components/CartBadge";

const skinCare = ["Fullmoon", "Blemish Block", "Velvet Touch", "Sunscreen"];
const hairCare = ["Shampoo", "Conditioner", "Hair Mask"];

const concerns = [
  {
    label: "Acne / Blemishes",import Link from "next/link";
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

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-[var(--ink)]">

              {/* SHOP */}
              <Link
                href="/shop"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Shop
              </Link>

              {/* BUILD YOUR ROUTINE */}
              <Link
                href="/build-your-routine"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Build Your Routine
              </Link>

              {/* BEST SELLERS */}
              <Link
                href="/shop?sort=bestselling"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Best Sellers
              </Link>

              {/* BUNDLES */}
              <Link
                href="/bundles"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Bundles
              </Link>

              {/* ABOUT */}
              <Link
                href="/about"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                About
              </Link>

            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-1">

              {/* Search */}
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

              {/* Cart */}
              <CartBadge />

            </div>

          </div>
        </div>
      </header>
    </div>
  );
}
    href: "/shop?concern=Acne#products",
  },
  {
    label: "Dry Skin / Pigmentation",
    href: "/shop?concern=Pigmentation#products",
  },
  {
    label: "Whitening / Brightening",
    href: "/shop?concern=Dry%20Skin#products",
  },
  {
    label: "Hair Care",
    href: "/shop?concern=Hair%20Care#products",
  },
  {
    label: "Sun Protection",
    href: "/shop?concern=Sun%20Protection#products",
  },
  {
    label: "Body Care",
    href: "/collections/body-care#products",
  },
];

const routines = [
  {
    label: "Acne & Blemishes",
    href: "/build-your-routine?routine=acne#routine",
  },
  {
    label: "Dry & Dull Skin",
    href: "/build-your-routine?routine=dry#routine",
  },
  {
    label: "Pigmentation / Brightening",
    href: "/build-your-routine?routine=brightening#routine",
  },
  {
    label: "Everyday Skin Care",
    href: "/build-your-routine?routine=everyday#routine",
  },
  {
    label: "Hair Care",
    href: "/build-your-routine?routine=hair#routine",
  },
  {
    label: "Body Care",
    href: "/build-your-routine?routine=body#routine",
  },
];

const dropdownItemClass =
  "block rounded-md px-3 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--milk-sage)] hover:text-[var(--deep-wine)]";

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

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-[var(--ink)]">

              {/* SHOP */}
              <Link
                href="/shop"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Shop
              </Link>

              {/* SHOP BY CONCERN */}
              <div className="group relative py-6 -my-6">
                <button
                  type="button"
                  className="hover:text-[var(--deep-wine)] transition-colors"
                >
                  Shop by Concern
                </button>

                <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block">
                  <div className="mt-1 w-64 bg-white shadow-xl border border-[var(--line)] rounded-lg p-3">

                    <div className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      Shop by Concern
                    </div>

                    <div className="flex flex-col gap-1">
                      {concerns.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={dropdownItemClass}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-[var(--line)] mt-2 pt-2">
                      <Link
                        href="/shop"
                        className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--deep-wine)] hover:bg-[var(--milk-sage)] transition-colors"
                      >
                        View All Products →
                      </Link>
                    </div>

                  </div>
                </div>
              </div>

              {/* BUILD YOUR ROUTINE */}
              <div className="group relative py-6 -my-6">
                <button
                  type="button"
                  className="hover:text-[var(--deep-wine)] transition-colors"
                >
                  Build Your Routine
                </button>

                <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block">
                  <div className="mt-1 w-72 bg-white shadow-xl border border-[var(--line)] rounded-lg p-3">

                    <div className="px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                        Find Your Routine
                      </div>

                      <div className="font-display text-base text-[var(--deep-wine)] mt-1">
                        Choose your skin goal
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {routines.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={dropdownItemClass}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-[var(--line)] mt-2 pt-2">
                      <Link
                        href="/build-your-routine"
                        className="block rounded-md px-3 py-2.5 text-sm font-medium text-[var(--deep-wine)] hover:bg-[var(--milk-sage)] transition-colors"
                      >
                        Build My Routine →
                      </Link>
                    </div>

                  </div>
                </div>
              </div>

              {/* BEST SELLERS */}
              <Link
                href="/shop?sort=bestselling"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Best Sellers
              </Link>

              {/* BUNDLES */}
              <Link
                href="/bundles"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Bundles
              </Link>

              {/* JOURNAL */}
              <Link
                href="/journal"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                Journal
              </Link>

              {/* ABOUT */}
              <Link
                href="/about"
                className="hover:text-[var(--deep-wine)] transition-colors"
              >
                About
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-1">

              {/* Search */}
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

              {/* Cart */}
              <CartBadge />
            </div>

          </div>
        </div>
      </header>
    </div>
  );
}
