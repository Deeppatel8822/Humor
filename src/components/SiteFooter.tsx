import Link from "next/link";

const shopLinks = [
  ["All Products", "/shop"],
  ["Skin Care", "/collections/skin-care"],
  ["Hair Care", "/collections/hair-care"],
  ["Body Care", "/collections/body-care"],
  ["Bundles", "/bundles"],
  ["Best Sellers", "/shop?sort=bestselling"],
] as const;

const brandLinks = [
  ["About Us", "/about"],
  ["Our Ingredients", "/ingredients"],
  ["Certifications", "/certifications"],
] as const;

const supportLinks = [
  ["Contact", "/contact"],
  ["Shipping & Returns", "/shipping-returns"],
  ["Track Order", "/track-order"],
  ["Privacy Policy", "/privacy-policy"],
  ["Terms & Conditions", "/terms-conditions"],
  ["Cancellation Policy", "/cancellation-policy"],
] as const;

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--deep-wine)] text-[var(--milk-sage)] mt-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-2xl text-white inline-block mb-4">
              Humor <span className="text-[var(--warm-gold)] italic">Luxury</span>
            </Link>
            <p className="text-sm text-[var(--milk-sage)]/70 leading-7 max-w-xs">
              Dermatologist-tested, cruelty-free skincare, haircare and bodycare,
              thoughtfully made in India.
            </p>
            <div className="flex gap-5 mt-6 text-sm text-[var(--milk-sage)]/80">
              <a
                href="https://www.instagram.com/humor_cosmetics/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-5">
              Shop
            </div>
            <ul className="space-y-3 text-sm text-[var(--milk-sage)]/80">
              {shopLinks.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-5">
              Brand
            </div>
            <ul className="space-y-3 text-sm text-[var(--milk-sage)]/80">
              {brandLinks.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--warm-gold)] mb-5">
              Support
            </div>
            <ul className="space-y-3 text-sm text-[var(--milk-sage)]/80">
              {supportLinks.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--milk-sage)]/15">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="font-display text-xl text-white">Join the Humor Luxury community</p>
              <p className="text-sm text-[var(--milk-sage)]/60 mt-1">
                Get skincare tips, new launches and exclusive updates.
              </p>
            </div>

            <form className="flex gap-2 w-full md:w-[380px]">
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address"
                className="min-w-0 flex-1 px-5 py-3 rounded-full text-sm text-[var(--ink)] bg-white/95 outline-none focus:ring-2 focus:ring-[var(--warm-gold)]"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-sm font-medium bg-[var(--warm-gold)] text-[var(--deep-wine)] hover:opacity-90 transition-opacity"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[var(--milk-sage)]/15 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[var(--milk-sage)]/55">
          <p>© {new Date().getFullYear()} Humor Luxury. All rights reserved.</p>
          <p>Made in India · Dermatologist Tested · Cruelty Free</p>
        </div>
      </div>
    </footer>
  );
}
