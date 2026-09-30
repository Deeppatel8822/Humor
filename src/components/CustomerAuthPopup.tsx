"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Mode = "signup" | "login";
type Method = "email" | "phone";

export default function CustomerAuthPopup() {
  const supabase = getSupabase();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signup");
  const [method, setMethod] = useState<Method>("email");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || data.session) return;
      const key = "humor_customer_popup_seen";
      if (!sessionStorage.getItem(key)) {
        window.setTimeout(() => {
          if (mounted) setOpen(true);
        }, 900);
      }
    });
    return () => { mounted = false; };
  }, [supabase]);

  function close() {
    sessionStorage.setItem("humor_customer_popup_seen", "1");
    setOpen(false);
    setError("");
  }

  async function sendOtp() {
    setError("");
    setMessage("");
    if (mode === "signup" && !name.trim()) return setError("Please enter your name.");
    if (method === "email" && !/^\S+@\S+\.\S+$/.test(identifier.trim())) return setError("Enter a valid email address.");
    if (method === "phone" && !/^\+?[1-9]\d{9,14}$/.test(identifier.replace(/[\s-]/g, ""))) return setError("Enter a valid mobile number with country code, e.g. +919586233163.");

    setLoading(true);
    const payload = method === "email"
      ? { email: identifier.trim().toLowerCase(), options: { shouldCreateUser: true, data: mode === "signup" ? { full_name: name.trim() } : undefined } }
      : { phone: identifier.replace(/[\s-]/g, ""), options: { shouldCreateUser: true, data: mode === "signup" ? { full_name: name.trim() } : undefined } };

    const { error: otpError } = await supabase.auth.signInWithOtp(payload as never);
    if (otpError) setError(otpError.message);
    else {
      setStep("otp");
      setMessage(method === "email" ? "OTP sent to your email." : "OTP sent to your mobile.");
    }
    setLoading(false);
  }

  async function verifyOtp() {
    setLoading(true);
    setError("");
    const tokenPayload = method === "email"
      ? { email: identifier.trim().toLowerCase(), token: otp.trim(), type: "email" as const }
      : { phone: identifier.replace(/[\s-]/g, ""), token: otp.trim(), type: "sms" as const };
    const { data, error: verifyError } = await supabase.auth.verifyOtp(tokenPayload);
    if (verifyError || !data.session) {
      setError(verifyError?.message || "Could not verify OTP.");
      setLoading(false);
      return;
    }

    const accessToken = data.session.access_token;
    const profileRes = await fetch("/api/customer/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + accessToken },
      body: JSON.stringify({ fullName: name.trim() || data.user.user_metadata?.full_name || "" }),
    });
    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      setError(profileData.error || "Could not save your profile.");
      setLoading(false);
      return;
    }

    window.dispatchEvent(new CustomEvent("humor-customer-auth"));
    setMessage("You're signed in. Welcome to Humor Luxury.");
    window.setTimeout(() => setOpen(false), 700);
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/20 px-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-sm rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-2xl">
        <button onClick={close} aria-label="Close" className="absolute right-4 top-4 h-8 w-8 rounded-full border border-[var(--line)] text-sm text-[var(--muted)]">×</button>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--warm-gold)]">Humor Luxury</p>
        <h2 className="mt-2 font-display text-2xl text-[var(--deep-wine)]">{mode === "signup" ? "Get 10% OFF your first order" : "Welcome back"}</h2>
        <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{mode === "signup" ? "Create your account with your email or mobile and unlock your first-order offer." : "Sign in to keep your offers and order history connected."}</p>

        <div className="mt-5 grid grid-cols-2 rounded-full bg-[var(--milk-sage)] p-1">
          <button onClick={() => { setMode("signup"); setStep("details"); setError(""); }} className={"rounded-full py-2 text-xs font-medium " + (mode === "signup" ? "bg-white text-[var(--deep-wine)] shadow-sm" : "text-[var(--muted)]")}>Sign up</button>
          <button onClick={() => { setMode("login"); setStep("details"); setError(""); }} className={"rounded-full py-2 text-xs font-medium " + (mode === "login" ? "bg-white text-[var(--deep-wine)] shadow-sm" : "text-[var(--muted)]")}>Login</button>
        </div>

        {step === "details" ? (
          <>
            <div className="mt-4 grid grid-cols-2 rounded-full border border-[var(--line)] p-1">
              <button onClick={() => setMethod("email")} className={"rounded-full py-2 text-xs " + (method === "email" ? "bg-[var(--deep-wine)] text-white" : "text-[var(--muted)]")}>Email</button>
              <button onClick={() => setMethod("phone")} className={"rounded-full py-2 text-xs " + (method === "phone" ? "bg-[var(--deep-wine)] text-white" : "text-[var(--muted)]")}>Mobile</button>
            </div>
            {mode === "signup" && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-4 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />}
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={method === "email" ? "Email address" : "Mobile number with +91"} type={method === "email" ? "email" : "tel"} className="mt-3 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            {message && <p className="mt-3 text-xs text-green-700">{message}</p>}
            <button onClick={sendOtp} disabled={loading} className="mt-4 w-full rounded-full bg-[var(--deep-wine)] px-5 py-3.5 text-sm font-medium text-white disabled:opacity-50">{loading ? "Sending OTP…" : "Continue"}</button>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm text-[var(--muted)]">{message}</p>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" inputMode="numeric" maxLength={6} className="mt-3 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm tracking-[0.3em] text-center outline-none" />
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            <button onClick={verifyOtp} disabled={loading || otp.length < 6} className="mt-4 w-full rounded-full bg-[var(--deep-wine)] px-5 py-3.5 text-sm font-medium text-white disabled:opacity-50">{loading ? "Verifying…" : "Verify & Sign in"}</button>
            <button onClick={() => setStep("details")} className="mt-3 w-full text-xs text-[var(--muted)]">Change email/mobile</button>
          </>
        )}

        <p className="mt-4 text-center text-[10px] leading-4 text-[var(--muted)]">By continuing, you agree to receive account and order-related messages.</p>
      </div>
    </div>
  );
}
