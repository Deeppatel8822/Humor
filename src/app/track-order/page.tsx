"use client";

import { useState } from "react";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(
      "Order tracking will be live once the order database is connected. In the meantime, check the email confirmation sent after your order."
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 md:px-8 py-16">
      <h1 className="font-display text-4xl text-[var(--deep-wine)] mb-3">Track your order</h1>
      <p className="text-[var(--muted)] mb-8 text-sm">Enter your order number and the email used at checkout.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Order number (e.g. HL-10234)" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="w-full border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-[var(--line)] rounded-lg px-4 py-3 text-sm bg-white" />
        <button type="submit" className="w-full bg-[var(--deep-wine)] text-white px-6 py-3.5 rounded-full text-sm font-medium hover:bg-[var(--ink)] transition-colors">
          Track order
        </button>
      </form>
      {status && <p className="mt-6 text-sm text-[var(--muted)] bg-[var(--milk-sage)] border border-[var(--line)] rounded-xl px-5 py-4">{status}</p>}
    </div>
  );
}
