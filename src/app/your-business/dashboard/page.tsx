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
const statusLabels: Record<string, string> = { approved: "Approved", pending: "Pending review", pending_verification: "Pending verification", rejected: "Rejected" };
const statusLabel = (status: string) => statusLabels[status] || status.replace(/[_:]/g, " ");

export default function PartnerDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("1000");
  const [withdrawalMessage, setWithdrawalMessage] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const handleCustomerAuth = () => {
      // Reload after the login popup establishes a session.
      window.location.reload();
    };
    window.addEventListener("humor-customer-auth", handleCustomerAuth);
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
    return () => {
      active = false;
      window.removeEventListener("humor-customer-auth", handleCustomerAuth);
    };
  }, []);

  async function requestWithdrawal() {
    setWithdrawalMessage("");
    setWithdrawing(true);
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Please log in again.");
      const amount = Number(withdrawalAmount);
      if (!Number.isInteger(amount) || amount < 1000) throw new Error("Enter a whole-rupee amount of at least ₹1,000.");
      if (!data || amount > data.walletBalance) throw new Error("The amount cannot exceed your available balance.");
      const res = await fetch("/api/business-programme/withdraw", { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify({ amount }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not submit request.");
      setWithdrawalMessage(json.message || "Request submitted.");
      setData((current) => current ? { ...current, walletBalance: Number(json.walletBalance ?? current.walletBalance), history: [{ amount: -Math.abs(amount), status: "withdrawal:pending", requestedAt: new Date().toISOString(), kind: "withdrawal" }, ...current.history].slice(0, 100) } : current);
      // Refresh from the canonical server ledger so the balance and request status are not left optimistic.
      try {
        const refreshed = await fetch("/api/business-programme/dashboard", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
        if (refreshed.ok) setData(await refreshed.json());
      } catch { /* Keep the successful response reflected if refresh is temporarily unavailable. */ }
    } catch (e) { setWithdrawalMessage(e instanceof Error ? e.message : "Could not submit request."); }
    finally { setWithdrawing(false); }
  }

  async function copyCode() {
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
    <main className="min-h-screen bg-[var(--paper)] px-5 py-10 text-[var(--ink)] md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/your-business" className="text-sm text-[var(--warm-gold)] hover:underline">← Start Your Business</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--warm-gold)]">Humor Luxury</p><h1 className="mt-2 font-display text-4xl text-[var(--ink)] md:text-5xl">Partner Dashboard</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Your referral code, reward coins and recent activity in one place.</p></div>
          {data && <span className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">{statusLabel(data.status)}</span>}
        </div>

        {loading && <div className="mt-8 rounded-2xl border border-[var(--line)] p-6 text-[var(--muted)]">Loading your dashboard…</div>}
        {error && !loading && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">{error}<div className="mt-3"><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("humor-open-customer-auth"))} className="font-semibold text-[var(--warm-gold)] underline">Log in / create account</button></div></div>}

        {data && !loading && <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Available coin balance", inr(data.walletBalance)],
              ["Lifetime coins", data.lifetimeCoins.toLocaleString("en-IN")],
              ["Eligible sales", inr(data.totalSales)],
              ["Referred customers", data.referredCustomers.toLocaleString("en-IN")],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-[var(--line)] bg-white shadow-sm p-5"><p className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</p><p className="mt-3 text-2xl font-semibold text-[var(--ink)]">{value}</p></div>)}
          </section>

          <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-[#D49A6A]/50 bg-gradient-to-br from-[#fff8fc] to-[#f4eaf2] shadow-sm p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--warm-gold)]">Your partner User ID</p><p className="mt-2 break-all font-mono text-xs text-[var(--muted)]">{data.userId}</p><p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--warm-gold)]">Your referral code</p>
              <div className="mt-3 flex flex-wrap items-center gap-3"><p className="break-all text-3xl font-bold tracking-wider text-[var(--ink)]">{data.code || "Awaiting approval"}</p>{data.code && <button onClick={copyCode} className="rounded-full bg-[var(--warm-gold)] px-4 py-2 text-sm font-bold text-[var(--ink)]">{copied ? "Copied!" : "Copy code"}</button>}</div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{data.status === "approved" ? "Share this code with customers. Eligible customers receive 10% off product value at checkout." : "Your code will be available after your application is approved."}</p>
              <div className="mt-6 border-t border-[var(--line)] pt-5"><p className="text-xs uppercase tracking-wider text-[var(--muted)]">Current reward tier</p><p className="mt-2 text-2xl font-semibold text-[var(--ink)]">{data.rewardTier.toUpperCase()} · {data.rewardRate}%</p><p className="mt-2 text-sm text-[var(--muted)]">{data.qualificationCoins.toLocaleString("en-IN")} coins in the current qualification window. Eligible sales ₹0–₹2,999: 25%; ₹3,000–₹4,999: 27%; ₹5,000+: 30% within 30 days. Higher rates apply to future eligible orders.</p></div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-semibold text-[var(--ink)]">How reward coins work</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]"><li>• Customers get 10% off eligible product value when they use your approved code.</li><li>• You earn reward coins only. There is no 10% reward cash or cash commission.</li><li>• ₹0–₹2,999 eligible sales: 25% coins.</li><li>• ₹3,000–₹4,999 eligible sales: 27% coins.</li><li>• ₹5,000 and above eligible sales: 30% coins.</li><li>• Higher rates apply to future eligible orders only.</li><li>• Minimum withdrawal request: ₹1,000 available balance.</li></ul>
              <p className="mt-5 text-xs leading-5 text-[var(--muted)]">Rewards can be adjusted for refunds, returns, chargebacks or ineligible orders. Earnings are not guaranteed.</p>
              <Link href="/start-your-business-terms.html" className="mt-5 inline-flex text-sm font-semibold text-[var(--warm-gold)] underline">Read programme terms</Link>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-[var(--line)] bg-white shadow-sm p-6 md:p-8">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Request a withdrawal</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Minimum ₹1,000. Requested funds are reserved from your available balance while the request is reviewed.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="flex min-w-[180px] flex-col gap-2 text-xs text-[var(--muted)]">Amount (₹)<input type="number" min="1000" max={data.walletBalance} step="1" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-base text-[var(--ink)] outline-none focus:border-[#D49A6A]" /></label>
              <button type="button" onClick={requestWithdrawal} disabled={withdrawing || data.status !== "approved" || data.walletBalance < 1000} className="self-end rounded-full bg-[var(--warm-gold)] px-6 py-3 text-sm font-bold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40">{withdrawing ? "Submitting…" : "Submit withdrawal request"}</button>
            </div>
            {withdrawalMessage && <p className="mt-3 text-sm text-[var(--ink)]" role="status">{withdrawalMessage}</p>}
          </section>

<section className="mt-5 rounded-2xl border border-[var(--line)] bg-white shadow-sm p-6 md:p-8">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Recent activity</h2>
            {data.history.length === 0 ? <p className="mt-4 text-sm text-[var(--muted)]">No reward activity recorded yet. Your eligible rewards will appear here after qualifying orders.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead><tr className="border-b border-[var(--line)] text-xs uppercase tracking-wider text-[var(--muted)]"><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Type</th><th className="py-3 pr-4">Amount</th><th className="py-3">Status / reference</th></tr></thead><tbody>{data.history.map((item, index) => <tr key={String(item.requestedAt) + item.status + index} className="border-b border-[var(--line)] text-[var(--ink)]"><td className="py-3 pr-4">{item.requestedAt ? new Date(item.requestedAt).toLocaleDateString("en-IN") : "—"}</td><td className="py-3 pr-4 capitalize">{item.kind}</td><td className="py-3 pr-4">{inr(item.amount)}</td><td className="py-3 break-all">{item.status.replace(/^reward:/, "Reward · ")}</td></tr>)}</tbody></table></div>}
          </section>
        </>}
      </div>
    </main>
  );
}
