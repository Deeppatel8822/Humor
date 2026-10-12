"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Dashboard = {
  status: string;
  userId: string;
  code: string | null;
  rewardTier: string;
  rewardRate: number;
  walletBalance: number;
  lifetimeCoins: number;
  qualificationCoins: number;
  qualificationPeriodStartedAt: string | null;
  totalSales: number;
  referredCustomers: number;
  history: { amount: number; status: string; requestedAt: string | null; kind: string }[];
};

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function PartnerDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("1000");
  const [withdrawalMessage, setWithdrawalMessage] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: sessionData } = await getSupabase().auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Please log in to view your partner dashboard.");
        const res = await fetch("/api/business-programme/dashboard", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load dashboard.");
        if (active) setData(json);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Could not load dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function requestWithdrawal() {\n    setWithdrawalMessage("");\n    setWithdrawing(true);\n    try {\n      const { data: sessionData } = await getSupabase().auth.getSession();\n      const token = sessionData.session?.access_token;\n      if (!token) throw new Error("Please log in again.");\n      const res = await fetch("/api/business-programme/withdraw", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ amount: Number(withdrawalAmount) }) });\n      const json = await res.json();\n      if (!res.ok) throw new Error(json.error || "Could not submit request.");\n      setWithdrawalMessage(json.message || "Request submitted.");\n      setData((current) => current ? { ...current, walletBalance: json.walletBalance, history: [{ amount: Number(withdrawalAmount), status: "withdrawal:pending", requestedAt: new Date().toISOString(), kind: "withdrawal" }, ...current.history].slice(0, 100) } : current);\n    } catch (e) { setWithdrawalMessage(e instanceof Error ? e.message : "Could not submit request."); }\n    finally { setWithdrawing(false); }\n  }\n\n  async function copyCode() {
    if (!data?.code) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the code. Please select and copy it manually.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--ink)] px-5 py-10 text-[var(--milk-sage)] md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/your-business" className="text-sm text-[var(--warm-gold)] hover:underline">← Start Your Business</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--warm-gold)]">Humor Luxury</p><h1 className="mt-2 font-display text-4xl text-white md:text-5xl">Partner Dashboard</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Your referral code, rewards and recent activity in one place.</p></div>
          {data && <span className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80">{data.status}</span>}
        </div>

        {loading && <div className="mt-8 rounded-2xl border border-white/10 p-6 text-white/70">Loading your dashboard…</div>}
        {error && !loading && <div className="mt-8 rounded-2xl border border-red-300/30 bg-red-950/20 p-5 text-sm text-white/80">{error}<div className="mt-3"><Link href="/login" className="font-semibold text-[var(--warm-gold)] underline">Log in / create account</Link></div></div>}

        {data && !loading && <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Available balance", inr(data.walletBalance)],
              ["Lifetime coins", data.lifetimeCoins.toLocaleString("en-IN")],
              ["Eligible sales", inr(data.totalSales)],
              ["Referred customers", data.referredCustomers.toLocaleString("en-IN")],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-xs uppercase tracking-wider text-white/50">{label}</p><p className="mt-3 text-2xl font-semibold text-white">{value}</p></div>)}
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-[#D49A6A]/30 bg-gradient-to-br from-[#4a1d39] to-[#251923] p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--warm-gold)]">Your partner User ID</p><p className="mt-2 break-all font-mono text-xs text-white/55">{data.userId}</p><p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--warm-gold)]">Your referral code</p>
              <div className="mt-3 flex flex-wrap items-center gap-3"><p className="break-all text-3xl font-bold tracking-wider text-white">{data.code || "Awaiting approval"}</p>{data.code && <button onClick={copyCode} className="rounded-full bg-[var(--warm-gold)] px-4 py-2 text-sm font-bold text-[var(--ink)]">{copied ? "Copied!" : "Copy code"}</button>}</div>
              <p className="mt-3 text-sm leading-6 text-white/65">{data.status === "approved" ? "Share this code with customers. Eligible customers receive 10% off product value at checkout." : "Your code will be available after your application is approved."}</p>
              <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs uppercase tracking-wider text-white/50">Current reward tier</p><p className="mt-2 text-2xl font-semibold text-white">{data.rewardTier.toUpperCase()} · {data.rewardRate}%</p><p className="mt-2 text-sm text-white/65">{data.qualificationCoins.toLocaleString("en-IN")} coins in the current qualification window. 3,000 unlocks 27%; 5,000 unlocks 30% within 30 days. Tier upgrades are permanent.</p></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <h2 className="text-xl font-semibold text-white">How rewards work</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/70"><li>• Basic tier starts at 25% of eligible product value.</li><li>• 3,000 eligible coins in 30 days unlocks 27%.</li><li>• 5,000 eligible coins in 30 days unlocks 30%.</li><li>• Higher rates apply to future eligible orders only.</li><li>• Minimum withdrawal request: ₹1,000 available balance.</li></ul>
              <p className="mt-5 text-xs leading-5 text-white/45">Rewards can be adjusted for refunds, returns, chargebacks or ineligible orders. Earnings are not guaranteed.</p>
              <Link href="/start-your-business-terms.html" className="mt-5 inline-flex text-sm font-semibold text-[var(--warm-gold)] underline">Read programme terms</Link>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white">Recent activity</h2>
            {data.history.length === 0 ? <p className="mt-4 text-sm text-white/55">No reward activity recorded yet. Your eligible rewards will appear here after qualifying orders.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45"><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Type</th><th className="py-3 pr-4">Amount</th><th className="py-3">Status / reference</th></tr></thead><tbody>{data.history.map((item, index) => <tr key={String(item.requestedAt) + item.status + index} className="border-b border-white/5 text-white/75"><td className="py-3 pr-4">{item.requestedAt ? new Date(item.requestedAt).toLocaleDateString("en-IN") : "—"}</td><td className="py-3 pr-4 capitalize">{item.kind}</td><td className="py-3 pr-4">{inr(item.amount)}</td><td className="py-3 break-all">{item.status.replace(/^reward:/, "Reward · ")}</td></tr>)}</tbody></table></div>}
          </section>
        </>}
      </div>
    </main>
  );
}
