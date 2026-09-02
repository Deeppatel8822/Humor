"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export default function CheckoutPage() {
  const { lines, subtotalInr, clearCart } = useCart();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "",
  });

  const freeShippingThreshold = 599;
  const shippingInr = subtotalInr >= freeShippingThreshold ? 0 : 60;
  const totalInr = subtotalInr + shippingInr;

  function updateField(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const required: (keyof typeof form)[] = ["fullName", "email", "phone", "line1", "city", "state", "pincode"];
    for (const field of required) {
      if (!form[field].trim()) return `Please fill in ${field}.`;
    }
    if (!/^\d{6}$/.test(form.pincode)) return "Enter a valid 6-digit pincode.";
    if (!/^\d{10}$/.test(form.phone)) return "Enter a valid 10-digit phone number.";
    return null;
  }

  async function handleCodOrder() {
    clearCart();
    router.push(`/order-confirmed?method=cod&total=${totalInr}`);
  }

  async function handleOnlinePayment() {
    const createRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData.error ?? "Could not start payment.");

    return new Promise<void>((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: createData.keyId,
        amount: createData.amountInr * 100,
        currency: "INR",
        name: "Humor Luxury",
        description: "Order payment",
        order_id: createData.razorpayOrderId,
        prefill: { name: form.fullName, email: form.email, contact: form.phone },
        theme: { color: "#4A1F2B" },
        handler: async (response: unknown) => {
          try {
            const r = response as { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; };
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...r,
                lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
                shipping: form, subtotalInr, shippingInr,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error ?? "Payment verification failed.");
            clearCart();
            router.push(`/order-confirmed?method=online&order=${verifyData.orderNumber}&total=${totalInr}`);
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
      });
      rzp.open();
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);
    setError(null);
    setSubmitting(true);
    try {
      if (paymentMethod === "cod") await handleCodOrder();
      else await handleOnlinePayment();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-24 text-center">
        <h1 className="font-display text-3xl text-[var(--deep-wine)] mb-3">Your cart is empty</h1>
        <p className="text-[var(--muted)]">Add products before checking out.</p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-14">
        <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-xl text-[var(--deep-wine)] mb-4">Shipping details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input placeholder="Full name" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} className="border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white sm:col-span-2" />
                <input placeholder="Email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
                <input placeholder="Phone (10 digits)" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
                <input placeholder="Address line 1" value={form.line1} onChange={(e) => updateField("line1", e.target.value)} className="border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white sm:col-span-2" />
                <input placeholder="Address line 2 (optional)" value={form.line2} onChange={(e) => updateField("line2", e.target.value)} className="border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white sm:col-span-2" />
                <input placeholder="City" value={form.city} onChange={(e) => updateField("city", e.target.value)} className="border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
                <input placeholder="State" value={form.state} onChange={(e) => updateField("state", e.target.value)} className="border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
                <input placeholder="Pincode (6 digits)" value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} className="border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl text-[var(--deep-wine)] mb-4">Payment method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 border border-[var(--line)] rounded-xl px-4 py-3.5 cursor-pointer has-[:checked]:border-[var(--deep-wine)] has-[:checked]:bg-[var(--milk-sage)]">
                  <input type="radio" name="payment" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
                  <div>
                    <div className="text-sm font-medium text-[var(--ink)]">Pay online — UPI, Cards, Netbanking</div>
                    <div className="text-xs text-[var(--muted)]">Secured by Razorpay</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 border border-[var(--line)] rounded-xl px-4 py-3.5 cursor-pointer has-[:checked]:border-[var(--deep-wine)] has-[:checked]:bg-[var(--milk-sage)]">
                  <input type="radio" name="payment" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                  <div>
                    <div className="text-sm font-medium text-[var(--ink)]">Cash on delivery</div>
                    <div className="text-xs text-[var(--muted)]">Pay when your order arrives</div>
                  </div>
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-[var(--dusty-rose)] bg-[var(--milk-sage)] rounded-lg px-4 py-3">{error}</p>}
          </div>

          <div className="bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl p-6 h-fit">
            <h2 className="font-display text-xl text-[var(--deep-wine)] mb-5">Order summary</h2>
            <div className="space-y-2 mb-4">
              {lines.map((l) => (
                <div key={l.productId} className="flex justify-between text-xs text-[var(--muted)]">
                  <span>{l.name} &times; {l.quantity}</span><span>&#8377;{l.price_inr * l.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--line)] pt-4 space-y-2">
              <div className="flex justify-between text-sm text-[var(--muted)]"><span>Subtotal</span><span>&#8377;{subtotalInr}</span></div>
              <div className="flex justify-between text-sm text-[var(--muted)]"><span>Shipping</span><span>{shippingInr === 0 ? "Free" : `\u20b9${shippingInr}`}</span></div>
              <div className="flex justify-between text-base font-semibold text-[var(--ink)] pt-2"><span>Total</span><span>&#8377;{totalInr}</span></div>
            </div>
            <button type="submit" disabled={submitting} className="w-full mt-6 bg-[var(--deep-wine)] text-white px-6 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--ink)] transition-colors disabled:opacity-50">
              {submitting ? "Processing..." : paymentMethod === "cod" ? "Place order" : `Pay \u20b9${totalInr}`}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
