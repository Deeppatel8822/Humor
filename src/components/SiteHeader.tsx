"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CartBadge from "@/components/CartBadge";

const mobileLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/build-your-routine", label: "Build Your Routine" },
  { href: "/shop?sort=bestselling", label: "Best Sellers" },
  { href: "/bundles", label: "Bundles" },
  { href: "/about", label: "About" },
  { href: "/your-business", label: "Start Your Business · ₹9", featured: true },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    import("@/lib/supabase").then(({ getSupabase }) => {
      if (!mounted) return;
      const supabase = getSupabase();

      const applyUser = (user: { user_metadata?: Record<string, unknown>; email?: string | null } | null) => {
        if (!mounted) return;
        if (!user) {
          setCustomerName(null);
          return;
        }
        const fullName = String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim();
        if (fullName) {
          setCustomerName(fullName.split(/\s+/)[0]);
          return;
        }
        const emailName = String(user.email || "").split("@")[0].replace(/[._-]+/g, " ").trim();
        const firstName = emailName.split(/\s+/)[0];
        setCustomerName(firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "");
      };

      supabase.auth.getUser().then(({ data }) => applyUser(data.user)).catch(() => applyUser(null));
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user || null));
      unsubscribe = () => listener.subscription.unsubscribe();
    }).catch(() => {
      if (mounted) setCustomerName(null);
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  async function openAccount() {
    try {
      const { getSupabase } = await import("@/lib/supabase");
      const { data } = await getSupabase().auth.getSession();
      if (data.session) router.push("/account");
      else window.dispatchEvent(new CustomEvent("humor-open-customer-auth"));
    } catch {
      window.dispatchEvent(new CustomEvent("humor-open-customer-auth"));
    }
  }

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-[var(--ink)] text-white text-center text-xs py-2 px-4">
        Free shipping on order above ₹249</div>

      <header className="bg-white/95 backdrop-blur border-b border-[var(--line)]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            <Link href="/" aria-label="Humor Luxury home" className="flex items-center shrink-0" onClick={() => setMenuOpen(false)}>
              <Image src="/humor-logo.svg" alt="Humor Luxury" width={180} height={54} priority className="h-10 md:h-12 w-auto object-contain" />
            </Link>

            <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-[var(--ink)]">
              {mobileLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={link.featured
                    ? "rounded-full bg-[var(--deep-wine)] px-4 py-2 text-[11px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--wine-soft)]"
                    : "hover:text-[var(--deep-wine)] transition-colors"}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              {customerName && (
                <button type="button" onClick={openAccount} aria-label={"Open " + customerName + "'s account"} className="hidden sm:inline-flex items-center mr-1 px-2 py-2 text-xs font-medium text-[var(--deep-wine)] hover:text-[var(--warm-gold)] transition-colors">
                  Hi {customerName}
                </button>
              )}

              <button type="button" aria-label="Login or sign up" onClick={openAccount} className="p-2 text-[var(--ink)] hover:text-[var(--deep-wine)] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5" />
                </svg>
              </button>

              <Link href="/search" aria-label="Search" className="p-2 text-[var(--ink)] hover:text-[var(--deep-wine)] transition-colors">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </Link>

              <div className="lg:hidden relative">
                <button type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="p-2 text-[var(--ink)] hover:text-[var(--deep-wine)] transition-colors">
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
                        className={link.featured
                          ? "block rounded-xl bg-[var(--deep-wine)] px-4 py-3 text-sm font-semibold text-white"
                          : "block rounded-xl px-4 py-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--milk-sage)] hover:text-[var(--deep-wine)]"}
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
