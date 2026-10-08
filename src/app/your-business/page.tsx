"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

const businessTypes = [
  "Influencer / Content Creator",
  "Salon / Parlour",
  "Beauty Professional",
  "Home Beauty Business",
  "Beauty Store / Retailer",
  "Other",
];

export default function YourBusinessPage() {
  const [sessionToken, setSessionToken] = useState("");
  const [form, setForm] = useState({
    businessType: "",
    businessName: "",
    mobile: "",
    address: "",
  });
  const [proof, setProof] = useState<File | null>(null);
  const [proofPath, setProofPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    import("@/lib/supabase").then(async ({ getSupabase }) => {
      const { data } = await getSupabase().auth.getSession();
      setSessionToken(data.session?.access_token || "");
    }).catch(() => {});
  }, []);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function getToken() {
    const { getSupabase } = await import("@/lib/supabase");
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token || "";
    setSessionToken(token);
    return token;
  }

  async function uploadProof(token: string) {
    if (!proof) throw new Error("Please upload your business proof.");
    if (proof.size > 5 * 1024 * 1024) throw new Error("Business proof must be 5 MB or smaller.");

    const payload = new FormData();
    payload.append("proof", proof);
    const res = await fetch("/api/business-programme/upload-proof", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: payload,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not upload business proof.");
    setProofPath(data.proofPath);
    return data.proofPath as string;
  }

  async function startPayment(token: string, finalProofPath: string) {
    const createRes = await fetch("/api/business-programme/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ ...form, proofPath: finalProofPath }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.error || "Could not start payment.");

    return new Promise<void>((resolve, reject) => {
      const RazorpayCheckout = (window as unknown as { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayCheckout({
        key: createData.keyId,
        amount: createData.amountInr * 100,
        currency: "INR",
        name: "Humor Luxury",
        description: "Humor Business Programme registration",
        order_id: createData.razorpayOrderId,
        prefill: { contact: form.mobile },
        theme: { color: "#7C5AA6" },
        handler: async (response: unknown) => {
          try {
            const paid = response as {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            };
            const verifyRes = await fetch("/api/business-programme/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
              body: JSON.stringify({
                ...paid,
                registration: { ...form, proofPath: finalProofPath },
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed.");
            setRegistered(true);
            setMessage("Registration successful. Your Humor Business Programme is now active.");
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
      });
      rzp.open();
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const token = await getToken();
      if (!token) {
        window.dispatchEvent(new CustomEvent("humor-open-customer-auth"));
        throw new Error("Please login or create your Humor account first, then submit the form again.");
      }
      if (!form.businessType || !form.businessName.trim() || !form.mobile.trim() || !form.address.trim() || !proof) {
        throw new Error("Please complete all fields and upload your business proof.");
      }
      if (!/^\d{10}$/.test(form.mobile.trim())) throw new Error("Enter a valid 10-digit mobile number.");

      const finalProofPath = proofPath || await uploadProof(token);
      await startPayment(token, finalProofPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <>
        <main className="min-h-[70vh] bg-[var(--milk-sage)] px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-[var(--line)] bg-white p-8 text-center shadow-[0_18px_60px_rgba(111,74,154,0.10)] md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--deep-wine)] text-2xl text-white">✓</div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--warm-gold)]">Registration Complete</p>
            <h1 className="mt-2 font-display text-4xl text-[var(--deep-wine)]">Welcome to Humor Business</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--muted)]">{message}</p>
            <Link href="/" className="mt-7 inline-flex rounded-full bg-[var(--deep-wine)] px-7 py-3.5 text-sm font-semibold text-white">Back to Humor Luxury</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <main className="min-h-[70vh] bg-[var(--milk-sage)]">
        <section className="border-b border-[var(--line)] bg-[var(--velvet-gradient-soft)]">
          <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Business Programme</p>
            <h1 className="max-w-4xl font-display text-4xl leading-tight text-[var(--ink)] md:text-6xl">Start Your Beauty Business for Just ₹9.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">Fill your business details, upload your business proof, pay the one-time ₹9 registration fee, and activate your programme.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-[var(--deep-wine)] px-5 py-2.5 text-sm font-semibold text-white">₹9 Registration</span>
              <span className="rounded-full border border-[var(--line)] bg-white/80 px-5 py-2.5 text-sm font-medium text-[var(--wine-soft)]">No hidden charges</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
          <form onSubmit={submit} className="rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-[0_18px_60px_rgba(111,74,154,0.08)] md:p-9">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--warm-gold)]">Step 1</p>
              <h2 className="mt-2 font-display text-3xl text-[var(--deep-wine)]">Business Registration</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Tell us about your business. After submission, you will be taken to secure ₹9 payment.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-[var(--ink)]">Business Type *</label>
                <select required value={form.businessType} onChange={(e) => update("businessType", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm">
                  <option value="">Select business type</option>
                  {businessTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)]">Business / Your Name *</label>
                <input required value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="Enter business name or your name" />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)]">Mobile Number *</label>
                <input required inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="10-digit mobile number" />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)]">Business Address *</label>
                <textarea required value={form.address} onChange={(e) => update("address", e.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="Full address" />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)]">Proof of Business *</label>
                <input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => { setProof(e.target.files?.[0] || null); setProofPath(""); }} className="mt-2 block w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" />
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Upload a business proof such as shop/salon photo, registration proof, business card, GST/PAN document, or other valid proof. JPG, PNG, WEBP or PDF up to 5 MB.</p>
              </div>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              {message && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>}

              <button type="submit" disabled={submitting} className="w-full rounded-full bg-[var(--deep-wine)] px-6 py-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(111,74,154,0.20)] transition-all hover:-translate-y-0.5 hover:bg-[var(--wine-soft)] disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? "Preparing ₹9 Payment…" : "Continue & Pay ₹9 →"}
              </button>
              <p className="text-center text-[11px] text-[var(--muted)]">Secure payment powered by Razorpay. Your registration activates only after successful payment.</p>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
