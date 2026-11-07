"use client";

import { useEffect, useState } from "react";

type ShippingProduct = {
  id: string;
  name: string;
  sku: string;
  status: string;
  weight_grams: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
};

export default function AdminShippingPage() {
  const [products, setProducts] = useState<ShippingProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { weight: string; length: string; width: string; height: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [connection, setConnection] = useState<{ connected: boolean; configured: boolean; message: string } | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/shipping-products", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load products.");
      setProducts(data.products || []);
      setDrafts(Object.fromEntries((data.products || []).map((p: ShippingProduct) => [p.id, {
        weight: p.weight_grams == null ? "" : String(p.weight_grams),
        length: p.length_cm == null ? "" : String(p.length_cm),
        width: p.width_cm == null ? "" : String(p.width_cm),
        height: p.height_cm == null ? "" : String(p.height_cm),
      }])));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load products."); }
    finally { setLoading(false); }
  }

  async function testConnection() {
    setConnection(null);
    try {
      const response = await fetch("/api/admin/shipmozo/connection", { cache: "no-store" });
      const data = await response.json();
      setConnection(data);
    } catch {
      setConnection({ connected: false, configured: false, message: "Connection test could not be completed." });
    }
  }

  async function save(product: ShippingProduct) {
    const draft = drafts[product.id];
    setSaving(product.id); setError("");
    try {
      const response = await fetch("/api/admin/shipping-products", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, weight_grams: draft.weight, length_cm: draft.length, width_cm: draft.width, height_cm: draft.height }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save package details.");
      setProducts(current => current.map(p => p.id === product.id ? { ...p, ...data.product } : p));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save package details."); }
    finally { setSaving(null); }
  }

  useEffect(() => { void load(); void testConnection(); }, []);

  const incomplete = products.filter(p => p.status === "live" && (!p.weight_grams || !p.length_cm || !p.width_cm || !p.height_cm)).length;

  return <main className="min-h-screen bg-[var(--milk-sage)] px-5 py-10 md:px-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Luxury · Logistics</p><h1 className="mt-2 font-display text-3xl text-[var(--deep-wine)]">Shipmozo Shipping Setup</h1><p className="mt-2 text-sm text-[var(--muted)]">Set packed-product weight and dimensions before enabling live shipping quotes.</p></div>
        <div className="flex flex-wrap gap-2"><a href="/admin/shipments" className="rounded-full bg-[var(--deep-wine)] px-5 py-2.5 text-sm text-white">Dispatch Orders</a><a href="/admin" className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm">Back to Admin</a></div>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl text-[var(--deep-wine)]">API Connection</h2><p className="mt-1 text-sm text-[var(--muted)]">Credentials are read only from server environment variables. They are never sent to the browser.</p></div><button onClick={testConnection} className="rounded-full bg-[var(--deep-wine)] px-5 py-2.5 text-sm text-white">Test connection</button></div>
        {connection && <p className={`mt-4 rounded-xl border p-3 text-sm ${connection.connected ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{connection.message}</p>}
        <p className="mt-3 text-xs text-[var(--muted)]">Required Vercel variables: SHIPMOZO_PUBLIC_KEY and SHIPMOZO_PRIVATE_KEY.</p>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-display text-xl text-[var(--deep-wine)]">Product Package Details</h2><p className="mt-1 text-sm text-[var(--muted)]">Weight in grams. Length, width and height in centimetres. Enter packed dimensions where possible.</p></div><div className="text-sm text-[var(--muted)]">{products.length - incomplete} / {products.length} complete · {incomplete} incomplete</div></div>
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? <p className="py-8 text-sm text-[var(--muted)]">Loading products…</p> : <div className="mt-5 divide-y divide-[var(--line)]">{products.map(product => <div key={product.id} className="grid gap-3 py-4 md:grid-cols-[minmax(180px,1.5fr)_repeat(4,minmax(90px,1fr))_auto] md:items-end">
          <div><p className="text-sm font-medium text-[var(--ink)]">{product.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{product.sku} · {product.status}</p></div>
          {(["weight", "length", "width", "height"] as const).map((field) => <label key={field} className="text-xs text-[var(--muted)]">{field === "weight" ? "Weight (g)" : field[0].toUpperCase() + field.slice(1) + " (cm)"}<input type="number" min="0.01" step="0.01" value={drafts[product.id]?.[field] ?? ""} onChange={e => setDrafts(current => ({ ...current, [product.id]: { ...current[product.id], [field]: e.target.value } }))} className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)]" /></label>)}
          <button onClick={() => save(product)} disabled={saving === product.id} className="rounded-full bg-[var(--deep-wine)] px-4 py-2.5 text-xs font-medium text-white disabled:opacity-50">{saving === product.id ? "Saving…" : "Save"}</button>
        </div>)}</div>}
      </section>
      <p className="text-xs leading-5 text-[var(--muted)]">Live checkout rate calculation and shipment booking remain disabled until Shipmozo confirms the exact API request/response contract for your account. This prevents guessed payloads from charging customers incorrect freight or creating duplicate shipments.</p>
    </div>
  </main>;
}
