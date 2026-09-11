"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import CartBadge from "@/components/CartBadge";

const mobileLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/build-your-routine", label: "Build Your Routine" },
  { href: "/shop?sort=bestselling", label: "Best Sellers" },
  { href: "/bundles", label: "Bundles" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-[var(--deep-wine)] text-white text-center text-xs py-2 px-4">
        Free shipping on all orders &nbsp;&middot;&nbsp; Dermatologist tested, made in India
      </div>

      <header className="bg-white/95 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            <Link href="/" aria-label="Humor Luxury home" className="flex items-center shrink-0" onClick={() => setMenuOpen(false)}>
              <Image
                src="/humor-logo.svg"
                alt="Humor Luxury"
                width={180}
                height={54}
                priority
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-[var(--ink)]">
              {mobileLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-[var(--deep-wine)] transition-colors">{link.label}</Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <Link href="/search" aria-label="Search" className="p-2 text-[var(--ink)] hover:text-[var(--deep-wine)] transition-colors">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </Link>

              <div className="lg:hidden relative">
                <button
                  type="button"
                  aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                  className="p-2 text-[var(--ink)] hover:text-[var(--deep-wine)] transition-colors"
                >
                  <span className="sr-only">Menu</span>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="12" cy="19" r="1.8" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-12 w-56 rounded-2xl border border-[var(--line)] bg-white p-2 shadow-xl">
                    {mobileLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-4 py-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--milk-sage)] hover:text-[var(--deep-wine)]"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <CartBadge />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
