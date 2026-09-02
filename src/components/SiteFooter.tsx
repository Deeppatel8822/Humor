import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--deep-wine)] text-[var(--milk-sage)] mt-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="font-display text-xl mb-3">Humor Luxury</div>
          <p className="text-sm text-[var(--milk-sage)]/70 leading-relaxed mb-5">
            Dermatologist-tested, cruelty-free skincare, haircare and bodycare, made in India.
          </p>
          <div className="flex gap-3 text-xs text-[var(--milk-sage)]/70">
            <a href="https://instagram.com/humorluxury" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>
            <a href="https://facebook.com/humorluxury" target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--warm-gold)] mb-3">Shop</div>
          <ul className="space-y-2 text-sm text-[var(--milk-sage)]/80">
            <li><Link href="/shop">All Products</Link></li>
            <li><Link href="/collections/skin-care">Skin Care</Link></li>
            <li><Link href="/collections/hair-care">Hair Care</Link></li>
            <li><Link href="/collections/body-care">Body Care</Link></li>
            <li><Link href="/bundles">Bundles</Link></li>
            <li><Link href="/shop?sort=bestselling">Best Sellers</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--warm-gold)] mb-3">Brand</div>
          <ul className="space-y-2 text-sm text-[var(--milk-sage)]/80">
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/ingredients">Our Ingredients</Link></li>
            <li><Link href="/certifications">Certifications</Link></li>
            <li><Link href="/journal">Journal</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--warm-gold)] mb-3">Support</div>
          <ul className="space-y-2 text-sm text-[var(--milk-sage)]/80">
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/shipping-returns">Shipping & Returns</Link></li>
            <li><Link href="/track-order">Track Order</Link></li>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/terms-conditions">Terms & Conditions</Link></li>
            <li><Link href="/cancellation-policy">Cancellation Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--milk-sage)]/15">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[var(--milk-sage)]/80">Join the Humor Luxury community</div>
          <form className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-64 px-4 py-2.5 rounded-full text-sm text-[var(--ink)] bg-white/95"
            />
            <button type="submit" className="px-5 py-2.5 rounded-full text-sm font-medium bg-white text-[var(--deep-wine)]">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-[var(--milk-sage)]/15 py-5 text-center text-xs text-[var(--milk-sage)]/60">
        © {new Date().getFullYear()} Humor Luxury. All rights reserved.
      </div>
    </footer>
  );
}
