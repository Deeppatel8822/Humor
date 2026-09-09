"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  catalog_id: number | null;
  name: string;
  sku: string;
  price_inr: number;
  stock_quantity: number;
  status: string;
  category: string;
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  async function loadProducts() {
    const res = await fetch("/api/admin/products", { cache: "no-store" });
    if (!res.ok) {
      setLoggedIn(false);
      return;
    }
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoggedIn(true);
  }

  useEffect(() => { loadProducts(); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Login failed.");
    } else {
      await loadProducts();
    }
    setLoading(false);
  }

  async function saveStock(id: string, stock: number) {
    setSaving(id);
    setError("");
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stock_quantity: stock }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not save stock.");
    else setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock_quantity: data.product.stock_quantity } : p));
    setSaving(null);
  }

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!loggedIn) {
    return (
      <main className="min-h-[70vh] bg-[var(--milk-sage)] flex items-center justify-center px-5 py-16">
        <form onSubmit={login} className="w-full max-w-md bg-white rounded-3xl border border-[var(--line)] p-8 md:p-10 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-3">Humor Luxury</p>
          <h1 className="font-display text-3xl text-[var(--deep-wine)]">Admin Login</h1>
          <p className="text-sm text-[var(--muted)] mt-2 mb-8">Manage products and inventory securely.</p>
          <label className="block text-xs font-medium text-[var(--ink)] mb-2">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-5 outline-none focus:border-[var(--deep-wine)]" />
          <label className="block text-xs font-medium text-[var(--ink)] mb-2">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-5 outline-none focus:border-[var(--deep-wine)]" />
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <button disabled={loading} className="w-full bg-[var(--deep-wine)] text-white rounded-full py-3.5 text-sm font-medium disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-[var(--milk-sage)] px-5 md:px-8 py-10 md:py-14">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-2">Humor Luxury</p>
            <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Products & Inventory</h1>
            <p className="text-sm text-[var(--muted)] mt-2">Update stock directly from your admin panel.</p>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full md:w-72 border border-[var(--line)] bg-white rounded-full px-5 py-3 text-sm outline-none" />
        </div>

        {error && <div className="bg-white border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}

        <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-4 bg-[var(--milk-sage)] border-b border-[var(--line)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <span>Product</span><span>SKU</span><span>Price</span><span>Stock</span><span>Action</span>
          </div>
          {filtered.map((p) => (
            <ProductRow key={p.id} product={p} saving={saving === p.id} onSave={saveStock} />
          ))}
          {!filtered.length && <div className="px-6 py-10 text-center text-sm text-[var(--muted)]">No products found.</div>}
        </div>
      </div>
    </main>
  );
}

function ProductRow({ product, saving, onSave }: { product: Product; saving: boolean; onSave: (id: string, stock: number) => void }) {
  const [stock, setStock] = useState(String(product.stock_quantity));
  const stockNumber = Number(stock);
  const status = stockNumber <= 0 ? "Out of stock" : stockNumber <= 5 ? "Low stock" : "In stock";
  return (
    <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-3 md:gap-4 px-5 md:px-6 py-5 border-b border-[var(--line)] last:border-b-0 items-center">
      <div><div className="font-medium text-sm text-[var(--ink)]">{product.name}</div><div className="text-xs text-[var(--muted)] capitalize mt-1">{product.category} · {product.status}</div></div>
      <div className="text-xs text-[var(--muted)]">{product.sku}</div>
      <div className="text-sm font-medium">₹{product.price_inr}</div>
      <div><input value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} min="0" type="number" className="w-24 border border-[var(--line)] rounded-lg px-3 py-2 text-sm" /><div className={`text-[11px] mt-1 ${stockNumber <= 0 ? "text-red-600" : stockNumber <= 5 ? "text-amber-600" : "text-green-700"}`}>{status}</div></div>
      <button onClick={() => onSave(product.id, stockNumber)} disabled={saving || !Number.isInteger(stockNumber) || stockNumber < 0} className="bg-[var(--deep-wine)] text-white rounded-full px-5 py-2.5 text-xs font-medium disabled:opacity-50">{saving ? "Saving…" : "Save stock"}</button>
    </div>
  );
}
