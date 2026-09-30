"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Mode = "signup" | "login";
type LoginMethod = "email" | "phone";

export default function CustomerAuthPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("signup");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      setOpen(false);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    const openEvent = () => setOpen(true);
    window.addEventListener("humor-open-customer-auth", openEvent);

    import("@/lib/supabase")
      .then(({ getSupabase }) => {
        if (!mounted) return;
        const supabase = getSupabase();
        supabase.auth.getSession().then(({ data }) => {
          if (!mounted) return;
          setOpen(!data.session);
        }).catch(() => {
          if (mounted) setOpen(true);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted && session) setOpen(false);
        });
        unsubscribe = () => listener.subscription.unsubscribe();
      })
      .catch(() => {
        if (mounted) setOpen(true);
      });

    return () => {
      mounted = false;
      unsubscribe?.();
      window.removeEventListener("humor-open-customer-auth", openEvent);
    };
  }, [pathname]);

  function reset(modeValue: Mode) {
    setMode(modeValue);
    setError("");
    setPassword("");
  }

  function close() {
    setOpen(false);
    setError("");
  }

  async function login() {
    setError("");
    if (!identifier.trim()) return setError("Enter your email or mobile number.");
    if (password.length < 6) return setError("Enter your password.");

    setLoading(true);
    try {
      const response = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invalid login details.");

      const { getSupabase } = await import("@/lib/supabase");
      const { error: sessionError } = await getSupabase().auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      if (sessionError) throw sessionError;

      window.dispatchEvent(new CustomEvent("humor-customer-auth"));
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not login.");
    } finally {
      setLoading(false);
    }
  }

  async function signup() {
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (!/^\+?[1-9]\d{9,14}$/.test(phone.replace(/[\s-]/g, ""))) return setError("Enter a valid mobile number with country code, e.g. +919586233163.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (!line1.trim() || !city.trim() || !state.trim() || !/^\d{6}$/.test(pincode)) return setError("Please complete your address and 6-digit pincode.");

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/[\s-]/g, "");
      const response = await fetch("/api/customer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          password,
          address: { line1: line1.trim(), line2: line2.trim(), city: city.trim(), state: state.trim(), pincode },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create account.");

      const loginResponse = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email.trim().toLowerCase(), password }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) throw new Error(loginData.error || "Account created, but login failed.");

      const { getSupabase } = await import("@/lib/supabase");
      const { error: sessionError } = await getSupabase().auth.setSession({
        access_token: loginData.session.access_token,
        refresh_token: loginData.session.refresh_token,
      });
      if (sessionError) throw sessionError;

      window.dispatchEvent(new CustomEvent("humor-customer-auth"));
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/20 px-4 py-6 backdrop-blur-[2px]">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-2xl">
        <button onClick={close} aria-label="Close" className="absolute right-4 top-4 h-8 w-8 rounded-full border border-[var(--line)] text-sm text-[var(--muted)]">×</button>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--warm-gold)]">Humor Luxury</p>
        <h2 className="mt-2 font-display text-2xl text-[var(--deep-wine)]">{mode === "signup" ? "Get 10% OFF your first order" : "Welcome back"}</h2>
        <p className="mt-2 text-sm leading-5 text-[var(--muted)]">
          {mode === "signup" ? "Create your account with your mobile, email, password and delivery address." : "Login with your email or mobile number and password."}
        </p>

        <div className="mt-5 grid grid-cols-2 rounded-full bg-[var(--milk-sage)] p-1">
          <button onClick={() => reset("signup")} className={"rounded-full py-2 text-xs font-medium " + (mode === "signup" ? "bg-white text-[var(--deep-wine)] shadow-sm" : "text-[var(--muted)]")}>Sign up</button>
          <button onClick={() => reset("login")} className={"rounded-full py-2 text-xs font-medium " + (mode === "login" ? "bg-white text-[var(--deep-wine)] shadow-sm" : "text-[var(--muted)]")}>Login</button>
        </div>

        {mode === "login" ? (
          <>
            <div className="mt-4 grid grid-cols-2 rounded-full border border-[var(--line)] p-1">
              <button onClick={() => setLoginMethod("email")} className={"rounded-full py-2 text-xs " + (loginMethod === "email" ? "bg-[var(--deep-wine)] text-white" : "text-[var(--muted)]")}>Email</button>
              <button onClick={() => setLoginMethod("phone")} className={"rounded-full py-2 text-xs " + (loginMethod === "phone" ? "bg-[var(--deep-wine)] text-white" : "text-[var(--muted)]")}>Mobile</button>
            </div>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={loginMethod === "email" ? "Email address" : "Mobile number with +91"} type={loginMethod === "email" ? "email" : "tel"} className="mt-4 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="mt-3 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            <button onClick={login} disabled={loading} className="mt-4 w-full rounded-full bg-[var(--deep-wine)] px-5 py-3.5 text-sm font-medium text-white disabled:opacity-50">{loading ? "Logging in…" : "Login"}</button>
          </>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none sm:col-span-2" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number with +91" type="tel" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" type="password" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none sm:col-span-2" />
              <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address line 1" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none sm:col-span-2" />
              <input value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Address line 2 (optional)" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none sm:col-span-2" />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />
              <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />
              <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode (6 digits)" inputMode="numeric" className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm outline-none" />
            </div>
            {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            <button onClick={signup} disabled={loading} className="mt-4 w-full rounded-full bg-[var(--deep-wine)] px-5 py-3.5 text-sm font-medium text-white disabled:opacity-50">{loading ? "Creating account…" : "Create account & get 10% OFF"}</button>
          </>
        )}

        <p className="mt-4 text-center text-[10px] leading-4 text-[var(--muted)]">Your account, contact details and delivery address are stored securely for orders and offers.</p>
      </div>
    </div>
  );
}
