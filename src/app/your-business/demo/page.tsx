"use client";

import Link from "next/link";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const sampleHistory = [
  { date: "16 Oct 2026", type: "Reward credit", amount: 250, status: "Demo · credited" },
  { date: "14 Oct 2026", type: "Coupon sale", amount: 180, status: "Demo · eligible" },
  { date: "12 Oct 2026", type: "Tier coins", amount: 75, status: "Demo · credited" },
];

export default function BusinessProgrammeDemoPage() {
  return (
    <main className="min-h-screen bg-[var(--ink)] px-5 py-10 text-[var(--milk-sage)] md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm text-amber-100">
          <strong>DEMO PREVIEW ONLY</strong>
          <p className="mt-1 text-amber-100/80">Sample information only. No real vendor account, payment, reward, withdrawal, or database changes are made on this page.</p>
        </div>
        <Link href="/your-business/register" className="text-sm text-[var(--warm-gold)] hover:underline">← Back to registration</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--warm-gold)]">Humor Luxury</p>
            <h1 className="mt-2 font-display text-4xl text-white md:text-5xl">Partner Dashboard</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Preview the experience a verified partner would see.</p>
          </div>
          <span className="rounded-full border border-amber-300/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-200">Demo · Approved sample</span>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Available balance", inr(1250)],
            ["Lifetime coins", "1,480"],
            ["Eligible sales", inr(5_920)],
            ["Referred customers", "12"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-wider text-white/50">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[#D49A6A]/30 bg-gradient-to-br from-[#4a1d39] to-[#251923] p-6 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--warm-gold)]">Your partner User ID</p>
            <p className="mt-2 font-mono text-sm text-white/70">DEMO-PARTNER-001</p>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--warm-gold)]">Your referral code</p>
            <p className="mt-3 break-all text-3xl font-bold tracking-wider text-white">DEMO10</p>
            <p className="mt-3 text-sm leading-6 text-white/65">Sample only: eligible customers receive 10% off with a partner code after approval.</p>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs uppercase tracking-wider text-white/50">Current reward tier</p>
              <p className="mt-2 text-2xl font-semibold text-white">Silver · 25%</p>
              <p className="mt-2 text-sm text-white/65">Demo qualification progress: 1,480 coins. 3,000 unlocks 27%; 5,000 unlocks 30% within the qualification window.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white">How rewards work</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-white/70">
              <li>• Basic tier starts at 25% of eligible product value.</li>
              <li>• 3,000 eligible coins in 30 days unlocks 27%.</li>
              <li>• 5,000 eligible coins in 30 days unlocks 30%.</li>
              <li>• Higher rates apply to future eligible orders only.</li>
              <li>• Minimum withdrawal request: ₹1,000 available balance.</li>
            </ul>
            <Link href="/start-your-business-terms.html" className="mt-5 inline-flex text-sm font-semibold text-[var(--warm-gold)] underline">Read programme terms</Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#D49A6A]/25 bg-white/[0.04] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white">Request a withdrawal</h2>
          <p className="mt-2 text-sm text-white/60">This preview is intentionally non-interactive. No withdrawal request will be submitted.</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex min-w-[180px] flex-col gap-2 text-xs text-white/50">Amount (₹)<input type="number" value="1000" readOnly className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white outline-none" /></label>
            <button type="button" disabled className="rounded-full bg-[var(--warm-gold)] px-6 py-3 text-sm font-bold text-[var(--ink)] opacity-40">Demo only · Disabled</button>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white">Recent activity</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45"><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Type</th><th className="py-3 pr-4">Amount</th><th className="py-3">Status</th></tr></thead>
              <tbody>{sampleHistory.map((item) => <tr key={item.date + item.type} className="border-b border-white/5 text-white/75"><td className="py-3 pr-4">{item.date}</td><td className="py-3 pr-4">{item.type}</td><td className="py-3 pr-4">{inr(item.amount)}</td><td className="py-3">{item.status}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
