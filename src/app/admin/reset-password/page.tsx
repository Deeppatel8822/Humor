"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setMessage("");
    if (password !== confirm) { setError("Passwords do not match."); setLoading(false); return; }
    const res = await fetch("/api/admin/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword: password }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Unable to reset password.");
    else { setMessage(data.message || "Password reset successfully."); setTimeout(() => router.replace("/admin/login"), 1200); }
    setLoading(false);
  }

  return <main className="min-h-screen bg-[var(--milk-sage)] flex items-center justify-center px-5 py-16"><form onSubmit={submit} className="w-full max-w-md bg-white rounded-3xl border border-[var(--line)] p-8 md:p-10 shadow-sm"><p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-3">Humor Luxury</p><h1 className="font-display text-3xl text-[var(--deep-wine)]">Reset Password</h1><p className="text-sm text-[var(--muted)] mt-2 mb-7">Create a new secure admin password.</p><label className="block text-xs font-medium mb-2">New password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={10} required placeholder="At least 10 characters" className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-4 outline-none" /><label className="block text-xs font-medium mb-2">Confirm password</label><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={10} required placeholder="Confirm password" className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-5 outline-none" />{error && <p className="text-sm text-red-600 mb-4">{error}</p>}{message && <p className="text-sm text-green-700 mb-4">{message}</p>}<button disabled={loading || !token} className="w-full bg-[var(--deep-wine)] text-white rounded-full py-3.5 text-sm font-medium disabled:opacity-50">{loading ? "Saving…" : "Reset Password"}</button>{!token && <p className="text-xs text-red-600 mt-4">This reset link is missing or invalid.</p>}</form></main>;
}
