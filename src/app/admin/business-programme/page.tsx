"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type RequestRow = { userId: string; email: string; name: string; mobile: string; amount: number; requestedAt: string; walletBalance: number; status: string; referenceId?: string };
const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function BusinessProgrammeAdminPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  async function load(currentToken?: string) {
    const activeToken = currentToken || token;
    if (!activeToken) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/business-programme/admin-withdrawals", { headers: { Authorization: "Bearer " + activeToken }, cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load requests.");
      setRows(json.requests || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      const currentToken = data.session?.access_token || "";
      if (!active) return;
      setToken(currentToken);
      if (!currentToken) {
        setError("Please log in with an authorised admin account.");
        setLoading(false);
        return;
      }
      await load(currentToken);
    })();
    return () => { active = false; };
  }, []);

  async function decide(row: RequestRow, decision: "approve" | "reject" | "mark_paid") {
    let payoutReference = "";
    if (decision === "mark_paid") {
      if (!window.confirm("Only continue after the bank transfer has actually completed. This records the payout and does not transfer money. Continue?")) return;
      payoutReference = window.prompt("Enter the completed bank transfer / UTR reference:")?.trim() || "";
      if (!payoutReference) return;
    }
    const key = row.userId + row.requestedAt;
    setBusy(key);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/business-programme/admin-withdrawals", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.userId, requestedAt: row.requestedAt, referenceId: row.referenceId, decision, ...(payoutReference ? { payoutReference } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not update request.");
      setMessage(json.message || "Request updated.");
      await load(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update request.");
    } finally {
      setBusy("");
    }
  }

  return <main className="min-h-screen bg-[var(--ink)] px-5 py-10 text-[var(--milk-sage)] md:px-8"><div className="mx-auto max-w-7xl">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--warm-gold)]">Humor Luxury · Internal</p>
    <h1 className="mt-2 font-display text-4xl text-white md:text-5xl">Withdrawal Review</h1>
    <p className="mt-3 text-sm text-white/60">Approve a request only after the payout details and identity checks are complete. Approval here records the decision; it does not transfer money.</p>
    {error && <p className="mt-5 rounded-xl border border-red-300/30 bg-red-950/20 p-4 text-sm text-white/80">{error}</p>}
    {message && <p className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-950/20 p-4 text-sm text-white/80">{message}</p>}
    <div className="mt-7 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
      {loading ? <p className="p-6 text-sm text-white/60">Loading withdrawal requests…</p> : rows.length === 0 ? <p className="p-6 text-sm text-white/60">No pending or approved-unpaid withdrawal requests.</p> : <table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45"><th className="p-4">Partner</th><th className="p-4">Contact</th><th className="p-4">Amount</th><th className="p-4">Requested</th><th className="p-4">Balance left</th><th className="p-4">Decision</th></tr></thead><tbody>{rows.map((row) => { const key = row.userId + row.requestedAt; return <tr key={key} className="border-b border-white/5"><td className="p-4"><p className="font-semibold text-white">{row.name}</p><p className="mt-1 max-w-[180px] break-all text-xs text-white/45">{row.userId}</p></td><td className="p-4"><p>{row.email}</p><p className="mt-1 text-white/50">{row.mobile || "No mobile listed"}</p></td><td className="p-4 font-semibold text-white">{inr(row.amount)}</td><td className="p-4">{row.requestedAt ? new Date(row.requestedAt).toLocaleString("en-IN") : "—"}</td><td className="p-4">{inr(row.walletBalance)}</td><td className="p-4">{row.status === "withdrawal:approved_unpaid" ? <button disabled={!!busy} onClick={() => decide(row, "mark_paid")} className="rounded-full bg-[var(--warm-gold)] px-4 py-2 text-xs font-bold text-[var(--ink)] disabled:opacity-40">{busy === key ? "Recording…" : "Record Payout"}</button> : <div className="flex gap-2"><button disabled={!!busy} onClick={() => decide(row, "approve")} className="rounded-full bg-[var(--warm-gold)] px-4 py-2 text-xs font-bold text-[var(--ink)] disabled:opacity-40">{busy === key ? "Saving…" : "Approve"}</button><button disabled={!!busy} onClick={() => decide(row, "reject")} className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Reject</button></div>}</td></tr>; })}</tbody></table>}
    </div>
    <p className="mt-5 text-xs leading-5 text-white/40">Access is controlled by the BUSINESS_PROGRAMME_ADMIN_EMAILS server environment variable (comma-separated admin emails). For approvals, complete the actual bank transfer outside this page and retain the payment reference.</p>
  </div></main>;
}
