"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Partner = {
  status: "pending" | "approved" | "rejected";
  code?: string;
  expiresAt?: string;
  usageCount?: number;
  usageLimit?: number;
  walletBalance?: number;
  totalRewards?: number;
  totalSales?: number;
  referredCustomers?: number;
};

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [application, setApplication] = useState<any>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { getSupabase } = await import("@/lib/supabase");
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }
      setLoggedIn(true);
      const response = await fetch("/api/marketing-partner/application", {
        headers: { Authorization: "Bearer " + data.session.access_token },
        cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        setPartner(result.partner);
        setApplication(result.application);
      } else {
        setError(result.error || "Could not load account.");
      }
    } catch {
      setError("Could not load your account.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <main className="max-w-5xl mx-auto px-5 md:px-8 py-20"><p className="text-sm text-[var(--muted)]">Loading your account…</p></main>;

  if (!loggedIn) {
    return (
      <main className="max-w-xl mx-auto px-5 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Luxury</p>
        <h1 className="font-display text-4xl text-[var(--deep-wine)] mt-3">My Account</h1>
        <p className="text-sm text-[var(--muted)] mt-3">Login to view your orders, profile and Marketing Partner rewards.</p>
        <button onClick={() => window.dispatchEvent(new CustomEvent("humor-open-customer-auth"))} className="mt-7 rounded-full bg-[var(--deep-wine)] text-white px-7 py-3.5 text-sm font-medium">Login / Create Account</button>
      </main>
    );
  }

  return (
    <main className="bg-[var(--milk-sage)] min-h-[70vh] px-5 md:px-8 py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Luxury</p>
        <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mt-2">My Account</h1>

        <button
          type="button"
          onClick={async () => {
            const { getSupabase } = await import("@/lib/supabase");
            await getSupabase().auth.signOut();
            window.location.href = "/";
          }}
          className="mt-5 rounded-full border border-[var(--deep-wine)] px-6 py-2.5 text-sm font-medium text-[var(--deep-wine)] hover:bg-[var(--deep-wine)] hover:text-white transition"
        >
          Logout
        </button>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Link href="/track-order" className="rounded-2xl bg-white border border-[var(--line)] p-5 hover:border-[var(--deep-wine)]">
            <p className="text-xs text-[var(--muted)]">Orders</p><p className="mt-2 font-medium text-[var(--ink)]">Track your orders →</p>
          </Link>
          <div className="rounded-2xl bg-white border border-[var(--line)] p-5">
            <p className="text-xs text-[var(--muted)]">Profile</p><p className="mt-2 font-medium text-[var(--ink)]">Your Humor Luxury account</p>
          </div>
          <Link href="/marketing-partner" className="rounded-2xl bg-white border border-[var(--line)] p-5 hover:border-[var(--deep-wine)]">
            <p className="text-xs text-[var(--muted)]">Partner</p><p className="mt-2 font-medium text-[var(--ink)]">{partner?.status === "approved" ? "Marketing Partner dashboard →" : "Become a Marketing Partner →"}</p>
          </Link>
        </div>

        {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {partner?.status === "approved" ? (
          <section className="mt-8 rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div>
                <span className="inline-flex rounded-full bg-[var(--milk-sage)] px-3 py-1 text-xs font-semibold text-[var(--deep-wine)]">✓ You are a Marketing Partner</span>
                <h2 className="font-display text-2xl text-[var(--deep-wine)] mt-4">Your Partner Wallet</h2>
                <p className="text-sm text-[var(--muted)] mt-1">Share your code, give customers a discount and earn 10% reward on eligible billed product value.</p>
              </div>
              <Link href="/marketing-partner" className="rounded-full border border-[var(--line)] px-5 py-2.5 text-xs font-medium">View dashboard</Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
              <div className="rounded-2xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Wallet balance</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-2">₹{Number(partner.walletBalance || 0).toLocaleString("en-IN")}</p></div>
              <div className="rounded-2xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Customers referred</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-2">{partner.referredCustomers || 0}</p></div>
              <div className="rounded-2xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Total rewards</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-2">₹{Number(partner.totalRewards || 0).toLocaleString("en-IN")}</p></div>
              <div className="rounded-2xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Referral sales</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-2">₹{Number(partner.totalSales || 0).toLocaleString("en-IN")}</p></div>
            </div>
          </section>
        ) : partner?.status === "pending" || application?.status === "pending" ? (
          <section className="mt-8 rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8">
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Application under review</span>
            <h2 className="font-display text-2xl text-[var(--deep-wine)] mt-4">Marketing Partner</h2>
            <p className="text-sm text-[var(--muted)] mt-2">Your registration has been submitted. Our team will verify your business details before activating your partner code.</p>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--warm-gold)]">Earn while you share</p>
            <h2 className="font-display text-2xl md:text-3xl text-[var(--deep-wine)] mt-2">Become a Marketing Partner</h2>
            <p className="text-sm leading-6 text-[var(--muted)] mt-2 max-w-2xl">Register your business, get a unique referral code and earn a flat 10% reward on eligible purchases made using your code. Customers also receive their partner discount.</p>
            <Link href="/marketing-partner" className="inline-flex mt-6 rounded-full bg-[var(--deep-wine)] text-white px-6 py-3.5 text-sm font-medium">Register as Marketing Partner</Link>
          </section>
        )}
      </div>
    </main>
  );
}
