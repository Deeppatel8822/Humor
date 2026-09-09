"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await fetch("/api/admin/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not send OTP."); else setSent(true);
    setLoading(false);
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await fetch("/api/admin/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, otp }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Invalid OTP."); else router.replace("/admin");
    setLoading(false);
  }

  return <main className="min-h-screen bg-[var(--milk-sage)] flex items-center justify-center px-5 py-16">
    <div className="w-full max-w-md bg-white rounded-3xl border border-[var(--line)] p-8 md:p-10 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-3">Humor Luxury</p>
      <h1 className="font-display text-3xl text-[var(--deep-wine)]">Admin Login</h1>
      <p className="text-sm text-[var(--muted)] mt-2 mb-8">Secure OTP login for your admin panel.</p>
      {!sent ? <form onSubmit={sendOtp}>
        <label className="block text-xs font-medium mb-2">Email ID or Mobile Number</label>
        <input value={identifier} onChange={e => setIdentifier(e.target.value)} required placeholder="Enter registered email or mobile" className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-5 outline-none" />
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <button disabled={loading} className="w-full bg-[var(--deep-wine)] text-white rounded-full py-3.5 text-sm font-medium disabled:opacity-50">{loading ? "Sending OTP…" : "Send OTP"}</button>
      </form> : <form onSubmit={verifyOtp}>
        <p className="text-sm text-[var(--muted)] mb-5">Enter the 6-digit OTP sent to your registered email and mobile.</p>
        <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required placeholder="000000" className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-5 text-center text-xl tracking-[0.35em] outline-none" />
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <button disabled={loading || otp.length !== 6} className="w-full bg-[var(--deep-wine)] text-white rounded-full py-3.5 text-sm font-medium disabled:opacity-50">{loading ? "Verifying…" : "Verify & Continue"}</button>
        <button type="button" onClick={() => { setSent(false); setOtp(""); setError(""); }} className="w-full mt-3 text-sm text-[var(--muted)]">Change email/mobile</button>
      </form>}
    </div>
  </main>;
}
