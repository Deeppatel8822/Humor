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

interface OrderItem {
  quantity: number;
  unit_price_inr: number;
  product?: { name?: string; sku?: string } | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal_inr: number;
  discount_inr: number;
  shipping_inr: number;
  total_inr: number;
  payment_status: string;
  tracking_number: string | null;
  created_at: string;
  customer?: { full_name?: string; email?: string; phone?: string } | null;
  address?: { line1?: string; line2?: string | null; city?: string; state?: string; pincode?: string; country?: string; phone?: string } | null;
  order_items: OrderItem[];
}

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [search, setSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  async function loadAdminData() {
    const [productsRes, ordersRes] = await Promise.all([
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
    ]);
    if (!productsRes.ok || !ordersRes.ok) {
      setLoggedIn(false);
      return;
    }
    const productsData = await productsRes.json();
    const ordersData = await ordersRes.json();
    setProducts(productsData.products ?? []);
    setOrders(ordersData.orders ?? []);
    setLoggedIn(true);
  }

  useEffect(() => { loadAdminData(); }, []);

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
    if (!res.ok) setError(data.error || "Login failed.");
    else await loadAdminData();
    setLoading(false);
  }

  async function saveProduct(id: string, stock: number, price: number) {
    setSaving(id);
    setError("");
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stock_quantity: stock, price_inr: price }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not update product.");
    else {
      setProducts((prev) => prev.map((p) => p.id === id ? {
        ...p,
        stock_quantity: data.product.stock_quantity,
        price_inr: data.product.price_inr,
      } : p));
    }
    setSaving(null);
  }

  async function saveOrder(id: string, status: string, trackingNumber: string) {
    setSaving(id);
    setError("");
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, tracking_number: trackingNumber }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not update order.");
    else setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: data.order.status, tracking_number: data.order.tracking_number } : o));
    setSaving(null);
  }

  const filteredProducts = products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    return `${o.order_number} ${o.customer?.full_name ?? ""} ${o.customer?.phone ?? ""} ${o.customer?.email ?? ""}`.toLowerCase().includes(q);
  });

  if (!loggedIn) {
    return (
      <>
        <style>{`body:has([data-admin-panel]) header, body:has([data-admin-panel]) footer, body:has([data-admin-panel]) a[aria-label="Chat with Humor Luxury on WhatsApp"] { display: none !important; }`}</style>
        <main data-admin-panel className="min-h-[70vh] bg-[var(--milk-sage)] flex items-center justify-center px-5 py-16">
          <form onSubmit={login} className="w-full max-w-md bg-white rounded-3xl border border-[var(--line)] p-8 md:p-10 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-3">Humor Luxury</p>
            <h1 className="font-display text-3xl text-[var(--deep-wine)]">Admin Login</h1>
            <p className="text-sm text-[var(--muted)] mt-2 mb-8">Manage orders, products and inventory securely.</p>
            <label className="block text-xs font-medium text-[var(--ink)] mb-2">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-5 outline-none focus:border-[var(--deep-wine)]" />
            <label className="block text-xs font-medium text-[var(--ink)] mb-2">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-5 outline-none focus:border-[var(--deep-wine)]" />
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <button disabled={loading} className="w-full bg-[var(--deep-wine)] text-white rounded-full py-3.5 text-sm font-medium disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button>
          </form>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{`body:has([data-admin-panel]) header, body:has([data-admin-panel]) footer, body:has([data-admin-panel]) a[aria-label="Chat with Humor Luxury on WhatsApp"] { display: none !important; }`}</style>
      <main data-admin-panel className="min-h-[70vh] bg-[var(--milk-sage)] px-5 md:px-8 py-10 md:py-14">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-7">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-2">Humor Luxury</p>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Admin Panel</h1>
              <p className="text-sm text-[var(--muted)] mt-2">Manage orders and inventory from one place.</p>
            </div>
            <button onClick={loadAdminData} className="self-start md:self-auto border border-[var(--line)] bg-white rounded-full px-5 py-2.5 text-xs font-medium">Refresh</button>
          </div>

          <div className="flex gap-2 mb-6">
            <button onClick={() => setTab("orders")} className={`rounded-full px-6 py-3 text-sm font-medium ${tab === "orders" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Orders ({orders.length})</button>
            <button onClick={() => setTab("products")} className={`rounded-full px-6 py-3 text-sm font-medium ${tab === "products" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Products & Inventory</button>
          </div>

          {error && <div className="bg-white border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}

          {tab === "orders" ? (
            <OrdersSection orders={filteredOrders} search={orderSearch} setSearch={setOrderSearch} saving={saving} onSave={saveOrder} />
          ) : (
            <ProductsSection products={filteredProducts} search={search} setSearch={setSearch} saving={saving} onSave={saveProduct} />
          )}
        </div>
      </main>
    </>
  );
}

function OrdersSection({ orders, search, setSearch, saving, onSave }: { orders: Order[]; search: string; setSearch: (v: string) => void; saving: string | null; onSave: (id: string, status: string, tracking: string) => void }) {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div><h2 className="font-display text-2xl text-[var(--deep-wine)]">Order Management</h2><p className="text-sm text-[var(--muted)] mt-1">Review customer details, products, payment and delivery status.</p></div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, name, phone…" className="w-full md:w-80 border border-[var(--line)] bg-white rounded-full px-5 py-3 text-sm outline-none" />
      </div>
      <div className="space-y-4">
        {orders.map((order) => <OrderCard key={order.id} order={order} saving={saving === order.id} onSave={onSave} />)}
        {!orders.length && <div className="bg-white rounded-2xl border border-[var(--line)] px-6 py-12 text-center text-sm text-[var(--muted)]">No orders found.</div>}
      </div>
    </div>
  );
}

function OrderCard({ order, saving, onSave }: { order: Order; saving: boolean; onSave: (id: string, status: string, tracking: string) => void }) {
  const [status, setStatus] = useState(order.status === "paid" ? "pending" : order.status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const date = new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const customer = order.customer;
  const address = order.address;

  return (
    <div className="bg-white rounded-2xl border border-[var(--line)] p-5 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-semibold text-[var(--deep-wine)]">#{order.order_number}</span>
            <span className={`text-[11px] uppercase tracking-wide rounded-full px-2.5 py-1 ${order.payment_status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{order.payment_status === "paid" ? "Paid" : "COD / Unpaid"}</span>
            <span className="text-xs text-[var(--muted)]">{date}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-5 text-sm">
            <div>
              <p className="font-medium">{customer?.full_name || "Guest Customer"}</p>
              <p className="text-[var(--muted)] mt-1">{customer?.phone || address?.phone || "No phone"}</p>
              <p className="text-[var(--muted)]">{customer?.email || "No email"}</p>
            </div>
            <div className="text-[var(--muted)] leading-6">
              <p>{address?.line1}{address?.line2 ? `, ${address.line2}` : ""}</p>
              <p>{address?.city}, {address?.state} - {address?.pincode}</p>
              <p>{address?.country || "India"}</p>
            </div>
          </div>
        </div>
        <div className="lg:text-right shrink-0">
          <p className="text-xs text-[var(--muted)]">Order total</p>
          <p className="text-2xl font-semibold text-[var(--deep-wine)]">₹{order.total_inr}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Shipping ₹{order.shipping_inr}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-[var(--line)] pt-5">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-3">Products</p>
        <div className="space-y-2">
          {order.order_items?.map((item, index) => (
            <div key={index} className="flex justify-between gap-4 text-sm">
              <span>{item.product?.name || "Product"} <span className="text-[var(--muted)]">× {item.quantity}</span></span>
              <span className="font-medium">₹{item.unit_price_inr * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-[var(--line)] pt-5 grid md:grid-cols-[1fr_1.2fr_auto] gap-3 items-end">
        <div><label className="block text-xs text-[var(--muted)] mb-2">Order status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-[var(--line)] rounded-xl px-4 py-3 text-sm bg-white">{ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}</select></div>
        <div><label className="block text-xs text-[var(--muted)] mb-2">Tracking number</label><input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Enter AWB / tracking number" className="w-full border border-[var(--line)] rounded-xl px-4 py-3 text-sm outline-none" /></div>
        <button onClick={() => onSave(order.id, status, tracking)} disabled={saving} className="bg-[var(--deep-wine)] text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save order"}</button>
      </div>
    </div>
  );
}

function ProductsSection({ products, search, setSearch, saving, onSave }: { products: Product[]; search: string; setSearch: (v: string) => void; saving: string | null; onSave: (id: string, stock: number, price: number) => void }) {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-5"><div><h2 className="font-display text-2xl text-[var(--deep-wine)]">Products & Inventory</h2><p className="text-sm text-[var(--muted)] mt-1">Update product price and stock directly from your admin panel.</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full md:w-72 border border-[var(--line)] bg-white rounded-full px-5 py-3 text-sm outline-none" /></div>
      <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-4 bg-[var(--milk-sage)] border-b border-[var(--line)] text-xs uppercase tracking-wide text-[var(--muted)]"><span>Product</span><span>SKU</span><span>Price</span><span>Stock</span><span>Action</span></div>
        {products.map((p) => <ProductRow key={p.id} product={p} saving={saving === p.id} onSave={onSave} />)}
        {!products.length && <div className="px-6 py-10 text-center text-sm text-[var(--muted)]">No products found.</div>}
      </div>
    </div>
  );
}

function ProductRow({ product, saving, onSave }: { product: Product; saving: boolean; onSave: (id: string, stock: number, price: number) => void }) {
  const [stock, setStock] = useState(String(product.stock_quantity));
  const [price, setPrice] = useState(String(product.price_inr));
  const stockNumber = Number(stock);
  const priceNumber = Number(price);
  const status = stockNumber <= 0 ? "Out of stock" : stockNumber <= 5 ? "Low stock" : "In stock";

  return (
    <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-3 md:gap-4 px-5 md:px-6 py-5 border-b border-[var(--line)] last:border-b-0 items-center">
      <div><div className="font-medium text-sm text-[var(--ink)]">{product.name}</div><div className="text-xs text-[var(--muted)] capitalize mt-1">{product.category} · {product.status}</div></div>
      <div className="text-xs text-[var(--muted)]">{product.sku}</div>
      <div><label className="md:hidden block text-[11px] text-[var(--muted)] mb-1">Price</label><div className="flex items-center"><span className="text-sm mr-1">₹</span><input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} min="1" type="number" className="w-24 border border-[var(--line)] rounded-lg px-3 py-2 text-sm" /></div></div>
      <div><label className="md:hidden block text-[11px] text-[var(--muted)] mb-1">Stock</label><input value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} min="0" type="number" className="w-24 border border-[var(--line)] rounded-lg px-3 py-2 text-sm" /><div className={`text-[11px] mt-1 ${stockNumber <= 0 ? "text-red-600" : stockNumber <= 5 ? "text-amber-600" : "text-green-700"}`}>{status}</div></div>
      <button onClick={() => onSave(product.id, stockNumber, priceNumber)} disabled={saving || !Number.isInteger(stockNumber) || stockNumber < 0 || !Number.isInteger(priceNumber) || priceNumber <= 0} className="bg-[var(--deep-wine)] text-white rounded-full px-5 py-2.5 text-xs font-medium disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
    </div>
  );
}
