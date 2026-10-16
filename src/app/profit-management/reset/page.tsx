"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

function ProfitPasswordResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password,setPassword] = useState("");
  const [confirm,setConfirm] = useState("");
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setNotice("");
    if (password.length < 10) return setError("Password must be at least 10 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const res = await fetch("/api/profit/access", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"reset",token,newPassword:password}) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not reset password.");
      setNotice(json.message || "Password reset successfully.");
      window.setTimeout(() => router.replace("/admin"), 1000);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not reset password."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#f7f3ee] flex items-center justify-center p-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#e8ded7] bg-white p-8 shadow-sm"><p className="text-xs uppercase tracking-[0.24em] text-[#b07b35]">Humor Luxury</p><h1 className="mt-3 font-display text-3xl text-[#351724]">Reset Profit Password</h1><p className="mb-6 mt-2 text-sm text-[#6d6260]">Create a new password for the Profit Management section.</p><label className="mb-2 block text-sm">New password</label><input type="password" required minLength={10} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 10 characters" className="mb-4 w-full rounded-xl border border-[#e8ded7] px-4 py-3" /><label className="mb-2 block text-sm">Confirm password</label><input type="password" required minLength={10} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password" className="mb-5 w-full rounded-xl border border-[#e8ded7] px-4 py-3" />{error && <p className="mb-3 text-sm text-red-600">{error}</p>}{notice && <p className="mb-3 text-sm text-green-700">{notice}</p>}<button disabled={busy || !token} className="w-full rounded-full bg-[#351724] py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Set new password"}</button>{!token && <p className="mt-4 text-sm text-red-600">This reset link is missing or invalid.</p>}</form></main>;
}


export default function ProfitPasswordResetPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f7f3ee] flex items-center justify-center p-5"><p className="text-sm text-[#6d6260]">Loading password reset…</p></main>}><ProfitPasswordResetForm /></Suspense>;
}
