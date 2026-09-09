"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";

export default function AdminLoginGate({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  async function checkSession() {
    try {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      setAuthenticated(res.ok);
    } catch {
      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { checkSession(); }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setStep("identifier");
    }, 500);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  async function sendOtp(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send OTP.");
      setExpiresAt(data.expiresAt);
      setSecondsLeft(Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 1000)));
      setStep("otp");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not send OTP."); }
    finally { setLoading(false); }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Incorrect OTP.");
      window.location.reload();
    } catch (err) { setError(err instanceof Error ? err.message : "Incorrect OTP."); setLoading(false); }
  }

  if (checking) return <div className="min-h-screen bg-[#f7f3ee] flex items-center justify-center text-sm text-[#6d6260]">Checking secure session…</div>;
  if (authenticated) return <>{children}</>;

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return <>
    <style>{`body:has([data-admin-login]) header, body:has([data-admin-login]) footer, body:has([data-admin-login]) a[aria-label="Chat with Humor Luxury on WhatsApp"] { display:none!important; }`}</style>
    <main data-admin-login className="min-h-screen bg-[#f7f3ee] flex items-center justify-center p-5 md:p-8">
      <div className="w-full max-w-6xl min-h-[620px] overflow-hidden rounded-[32px] bg-white border border-[#e8ded7] shadow-[0_20px_70px_rgba(62,23,48,0.10)] grid lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:flex bg-[#eee3d8] p-12 xl:p-16 relative overflow-hidden flex-col justify-between">
          <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border-[55px] border-[#dcc9b6] opacity-60" />
          <div className="absolute right-12 bottom-10 h-56 w-56 rounded-full bg-[#e3d3c2] opacity-50" />
          <div className="relative">
            <p className="text-sm tracking-[0.28em] text-[#b07b35] font-medium">HUMOR LUXURY</p>
            <h2 className="font-display text-5xl xl:text-6xl text-[#351724] mt-14 leading-[1.08]">Premium care<br/>for a better you.</h2>
            <p className="mt-7 max-w-sm text-base leading-7 text-[#6d6260]">Manage orders, products and inventory securely from one place.</p>
            <div className="mt-12 space-y-6 text-sm">
              <div><p className="font-semibold text-[#351724]">Secure Access</p><p className="text-[#6d6260] mt-1">OTP verified administrator login</p></div>
              <div><p className="font-semibold text-[#351724]">Fast & Simple</p><p className="text-[#6d6260] mt-1">Login in seconds without passwords</p></div>
              <div><p className="font-semibold text-[#351724]">Business Control</p><p className="text-[#6d6260] mt-1">Orders, dispatch and inventory in one place</p></div>
            </div>
          </div>
          <p className="relative font-display italic text-3xl text-[#351724]">Self care is luxury.</p>
        </section>

        <section className="p-7 md:p-12 xl:p-16 flex flex-col justify-center">
          <div className="max-w-xl w-full mx-auto">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-[#b07b35] font-medium">HUMOR LUXURY</p>
              <h1 className="font-display text-4xl md:text-5xl text-[#351724] mt-3">Admin Login</h1>
              <p className="text-sm md:text-base text-[#6d6260] mt-3">Secure access with OTP verification</p>
            </div>

            <div className="flex items-center justify-center gap-0 mt-10 mb-9">
              {[['1','Enter Details'],['2','Verify OTP'],['3','Login']].map(([n,label], i) => {
                const active = (step === 'identifier' && i === 0) || (step === 'otp' && i === 1);
                const done = step === 'otp' && i === 0;
                return <div key={n} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center min-w-[78px]"><span className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${active || done ? 'bg-[#5a1f34] text-white' : 'bg-[#ecebea] text-[#6d6260]'}`}>{done ? '✓' : n}</span><span className="text-xs mt-2 text-[#4d4442] whitespace-nowrap">{label}</span></div>
                  {i < 2 && <div className={`h-px flex-1 mx-2 mt-[-18px] ${done ? 'bg-[#5a1f34]' : 'bg-[#ddd6d2]'}`} />}
                </div>;
              })}
            </div>

            {step === "identifier" ? <form onSubmit={sendOtp}>
              <label className="block text-sm font-medium text-[#302728] mb-2">Email or Mobile Number</label>
              <input value={identifier} onChange={e => setIdentifier(e.target.value)} required autoComplete="username" placeholder="Enter registered email or mobile" className="w-full h-14 border border-[#ded5cf] rounded-2xl px-5 text-base outline-none focus:border-[#5a1f34]" />
              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
              <button disabled={loading} className="w-full h-14 mt-6 rounded-full bg-[#5a1f34] text-white font-semibold disabled:opacity-50">{loading ? "Sending OTP…" : "Send OTP"}</button>
              <p className="text-center text-xs text-[#6d6260] mt-4">OTP will be sent to your registered admin email.</p>
            </form> : <form onSubmit={verifyOtp}>
              <label className="block text-sm font-medium text-[#302728] mb-2">Enter 6-digit OTP</label>
              <input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))} required inputMode="numeric" autoFocus placeholder="••••••" className="w-full h-14 border border-[#ded5cf] rounded-2xl px-5 text-center text-2xl tracking-[0.45em] outline-none focus:border-[#5a1f34]" />
              {secondsLeft > 0 && <p className="text-xs text-[#6d6260] mt-3 text-center">OTP expires in {minutes}:{seconds}</p>}
              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
              <button disabled={loading || otp.length !== 6 || secondsLeft === 0} className="w-full h-14 mt-6 rounded-full bg-[#5a1f34] text-white font-semibold disabled:opacity-50">{loading ? "Verifying…" : "Verify & Login"}</button>
              <div className="flex items-center justify-between mt-4 text-xs"><button type="button" onClick={() => { setStep('identifier'); setOtp(''); setError(''); }} className="text-[#5a1f34] font-medium">Change email / mobile</button><button type="button" onClick={() => sendOtp()} className="text-[#5a1f34] font-medium">Resend OTP</button></div>
            </form>}

            <div className="mt-8 rounded-2xl bg-[#f7f5f2] border border-[#eee7e1] p-5 flex gap-4">
              <div className="text-[#b07b35] text-xl">◈</div><div><p className="font-semibold text-sm text-[#403638]">Secure · Verified · 24 Hour Session</p><p className="text-xs text-[#6d6260] mt-1">Your admin account is protected with OTP verification.</p></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </>;
}
