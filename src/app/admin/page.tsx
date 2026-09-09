"use client";

import { useEffect, useMemo, useState } from "react";

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

const STAGES = [
  { key: "new", label: "New Orders" },
  { key: "packing", label: "Packing" },
  { key: "ready", label: "Ready to Dispatch" },
  { key: "shipping", label: "Shipping" },
  { key: "complete", label: "Complete" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

function stageFor(status: string): StageKey {
  if (status === "pending" || status === "paid") return "new";
  if (status === "confirmed") return "packing";
  if (status === "processing") return "ready";
  if (status === "shipped") return "shipping";
  if (status === "delivered") return "complete";
  return "cancelled";
}

function stageLabel(status: string) {
  return STAGES.find((s) => s.key === stageFor(status))?.label ?? "Order";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function printShippingLabel(order: Order) {
  const popup = window.open("", "humor-shipping-label", "width=900,height=700");
  if (!popup) {
    alert("Please allow pop-ups to print the shipping label.");
    return;
  }

  const customer = order.customer?.full_name || "Customer";
  const phone = order.customer?.phone || order.address?.phone || "";
  const address = order.address;
  const addressHtml = [address?.line1, address?.line2, address?.city, address?.state, address?.pincode, address?.country || "India"]
    .filter(Boolean)
    .join(", ");
  const productsHtml = order.order_items?.map((item) => `<tr><td>${item.product?.name || "Product"}</td><td>${item.quantity}</td><td>₹${item.unit_price_inr * item.quantity}</td></tr>`).join("") || "";

  popup.document.write(`<!doctype html><html><head><title>Shipping Label - ${order.order_number}</title><style>
    *{box-sizing:border-box}body{margin:0;padding:24px;font-family:Arial,sans-serif;color:#222;background:#fff}.label{width:100%;max-width:760px;margin:auto;border:2px solid #222;padding:28px}.brand{font-size:26px;font-weight:700;letter-spacing:2px}.small{font-size:12px;color:#666}.row{display:flex;justify-content:space-between;gap:20px}.box{border:1px solid #bbb;padding:18px;margin-top:18px}.title{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#666;margin-bottom:8px}.customer{font-size:22px;font-weight:700;margin-bottom:8px}.address{font-size:18px;line-height:1.5}.tracking{font-size:26px;font-weight:700;letter-spacing:1px}.total{font-size:20px;font-weight:700}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{text-align:left;border-bottom:1px solid #ddd;padding:9px 4px;font-size:14px}th{font-size:11px;text-transform:uppercase;color:#666}@media print{body{padding:0}.label{max-width:none;border:2px solid #222;min-height:100vh}}button{padding:12px 20px;border:0;border-radius:999px;background:#3e1730;color:white;font-size:14px;margin-top:22px;cursor:pointer}</style></head><body><div class="label">
    <div class="row"><div><div class="brand">HUMOR LUXURY</div><div class="small">Beauty, thoughtfully made. · Made in India</div></div><div style="text-align:right"><div class="title">Order</div><div style="font-size:22px;font-weight:700">#${order.order_number}</div></div></div>
    <div class="box"><div class="title">Ship To</div><div class="customer">${customer}</div><div class="address">${addressHtml}</div><div style="margin-top:8px">Phone: ${phone}</div></div>
    <div class="box"><div class="title">Tracking / AWB</div><div class="tracking">${order.tracking_number || "TO BE UPDATED"}</div></div>
    <div class="box"><div class="title">Items</div><table><thead><tr><th>Product</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${productsHtml}</tbody></table><div style="text-align:right;margin-top:14px" class="total">Total: ₹${order.total_inr}</div></div>
    <div class="row" style="margin-top:18px"><div class="small">Payment: ${order.payment_status === "paid" ? "Online Paid" : "Cash on Delivery"}</div><div class="small">Order date: ${formatDate(order.created_at)}</div></div>
    <button onclick="window.print()">Print Label</button>
  </div></body></html>`);
  popup.document.close();
  popup.focus();
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [stage, setStage] = useState<StageKey>("new");
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

  useEffect(() => {
    loadAdminData();
    const timer = window.setInterval(loadAdminData, 30000);
    return () => window.clearInterval(timer);
  }, []);

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
    else setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock_quantity: data.product.stock_quantity, price_inr: data.product.price_inr } : p));
    setSaving(null);
  }

  async function moveOrder(id: string, nextStatus: string, trackingNumber?: string) {
    setSaving(id);
    setError("");
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus, tracking_number: trackingNumber ?? undefined }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Could not update order.");
    else {
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: data.order.status, tracking_number: data.order.tracking_number } : o));
      if (nextStatus === "shipped") setStage("shipping");
    }
    setSaving(null);
  }

  const filteredProducts = products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase();
    return orders
      .filter((o) => stageFor(o.status) === stage)
      .filter((o) => `${o.order_number} ${o.customer?.full_name ?? ""} ${o.customer?.phone ?? ""} ${o.customer?.email ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, stage, orderSearch]);

  const stageCounts = useMemo(() => STAGES.reduce((acc, s) => ({ ...acc, [s.key]: orders.filter((o) => stageFor(o.status) === s.key).length }), {} as Record<StageKey, number>), [orders]);
  const newCount = stageCounts.new || 0;

  if (!loggedIn) {
    return (
      <><style>{`body:has([data-admin-panel]) header, body:has([data-admin-panel]) footer, body:has([data-admin-panel]) a[aria-label="Chat with Humor Luxury on WhatsApp"] { display: none !important; }`}</style>
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
    <><style>{`body:has([data-admin-panel]) header, body:has([data-admin-panel]) footer, body:has([data-admin-panel]) a[aria-label="Chat with Humor Luxury on WhatsApp"] { display: none !important; }`}</style>
      <main data-admin-panel className="min-h-[70vh] bg-[var(--milk-sage)] px-5 md:px-8 py-10 md:py-14">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-7">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-2">Humor Luxury</p>
              <h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Admin Panel</h1>
              <p className="text-sm text-[var(--muted)] mt-2">Orders move from New → Packing → Ready to Dispatch → Shipping → Complete.</p>
            </div>
            <button onClick={loadAdminData} className="self-start md:self-auto border border-[var(--line)] bg-white rounded-full px-5 py-2.5 text-xs font-medium">Refresh</button>
          </div>

          <div className="flex gap-2 mb-6">
            <button onClick={() => setTab("orders")} className={`rounded-full px-5 md:px-6 py-3 text-sm font-medium ${tab === "orders" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Orders {newCount > 0 && <span className="ml-1 inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px]">{newCount}</span>}</button>
            <button onClick={() => setTab("products")} className={`rounded-full px-5 md:px-6 py-3 text-sm font-medium ${tab === "products" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]`}>Products & Inventory</button>
          </div>

          {error && <div className="bg-white border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}

          {tab === "orders" ? (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
                {STAGES.map((s) => (
                  <button key={s.key} onClick={() => setStage(s.key)} className={`text-left rounded-2xl p-4 border transition ${stage === s.key ? "bg-[var(--deep-wine)] text-white border-[var(--deep-wine)]" : "bg-white border-[var(--line)]"}`}>
                    <div className="text-xs opacity-80">{s.label}</div><div className="text-2xl font-semibold mt-1">{stageCounts[s.key] || 0}</div>
                  </button>
                ))}
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div><h2 className="font-display text-2xl text-[var(--deep-wine)]">{STAGES.find((s) => s.key === stage)?.label}</h2><p className="text-sm text-[var(--muted)] mt-1">Newest orders appear first.</p></div>
                <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search order, name, phone…" className="w-full md:w-80 border border-[var(--line)] bg-white rounded-full px-5 py-3 text-sm outline-none" />
              </div>
              <div className="space-y-4">
                {filteredOrders.map((order) => <OrderCard key={order.id} order={order} saving={saving === order.id} onMove={moveOrder} onPrint={() => printShippingLabel(order)} />)}
                {!filteredOrders.length && <div className="bg-white rounded-2xl border border-[var(--line)] px-6 py-12 text-center text-sm text-[var(--muted)]">No orders in this stage.</div>}
              </div>
            </div>
          ) : <ProductsSection products={filteredProducts} search={search} setSearch={setSearch} saving={saving} onSave={saveProduct} />}
        </div>
      </main>
    </>
  );
}

function OrderCard({ order, saving, onMove, onPrint }: { order: Order; saving: boolean; onMove: (id: string, status: string, tracking?: string) => void; onPrint: () => void }) {
  const stage = stageFor(order.status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const customer = order.customer;
  const address = order.address;

  return (
    <div className={`bg-white rounded-2xl border p-5 md:p-6 ${stage === "new" ? "border-red-300 shadow-sm" : "border-[var(--line)]"}`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-semibold text-lg text-[var(--deep-wine)]">#{order.order_number}</span>
            {stage === "new" && <span className="text-[11px] uppercase tracking-wide rounded-full px-3 py-1 bg-red-100 text-red-700 font-semibold">NEW ORDER</span>}
            <span className={`text-[11px] uppercase tracking-wide rounded-full px-3 py-1 ${order.payment_status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{order.payment_status === "paid" ? "Paid" : "COD / Unpaid"}</span>
            <span className="text-xs text-[var(--muted)]">{formatDate(order.created_at)}</span>
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
        <div className="lg:text-right shrink-0"><p className="text-xs text-[var(--muted)]">Order total</p><p className="text-2xl font-semibold text-[var(--deep-wine)]">₹{order.total_inr}</p><p className="text-xs text-[var(--muted)] mt-1">{stageLabel(order.status)}</p></div>
      </div>

      <div className="mt-5 border-t border-[var(--line)] pt-5">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-3">Products</p>
        <div className="space-y-2">{order.order_items?.map((item, index) => <div key={index} className="flex justify-between gap-4 text-sm"><span>{item.product?.name || "Product"} <span className="text-[var(--muted)]">× {item.quantity}</span></span><span className="font-medium">₹{item.unit_price_inr * item.quantity}</span></div>)}</div>
      </div>

      <div className="mt-5 border-t border-[var(--line)] pt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {stage === "new" && <button onClick={() => onMove(order.id, "confirmed")} disabled={saving} className="bg-[var(--deep-wine)] text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "✓ Accept Order"}</button>}
          {stage === "packing" && <button onClick={() => onMove(order.id, "processing")} disabled={saving} className="bg-[var(--deep-wine)] text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "✓ Ready for Dispatch"}</button>}
          {stage === "ready" && <button onClick={() => onMove(order.id, "shipped")} disabled={saving} className="bg-[var(--deep-wine)] text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50">{saving ? "Dispatching…" : "🚚 Move to Shipping"}</button>}
          {stage === "shipping" && <><button onClick={onPrint} className="border border-[var(--deep-wine)] text-[var(--deep-wine)] bg-white rounded-full px-6 py-3 text-sm font-medium">🖨 Print Shipping Label</button><button onClick={() => onMove(order.id, "delivered", tracking)} disabled={saving} className="bg-[var(--deep-wine)] text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "✓ Mark Delivered"}</button></>}
        </div>
        {stage === "shipping" && <div className="w-full md:w-80"><label className="block text-xs text-[var(--muted)] mb-2">Tracking / AWB Number</label><input value={tracking} onChange={(e) => setTracking(e.target.value)} onBlur={() => tracking !== (order.tracking_number ?? "") && onMove(order.id, "shipped", tracking)} placeholder="Enter AWB / tracking number" className="w-full border border-[var(--line)] rounded-xl px-4 py-3 text-sm outline-none" /></div>}
        {stage === "complete" && <div className="text-sm font-medium text-green-700">✓ Order completed</div>}
        {stage === "cancelled" && <div className="text-sm font-medium text-red-600">Order cancelled</div>}
      </div>
    </div>
  );
}

function ProductsSection({ products, search, setSearch, saving, onSave }: { products: Product[]; search: string; setSearch: (v: string) => void; saving: string | null; onSave: (id: string, stock: number, price: number) => void }) {
  return <div><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-5"><div><h2 className="font-display text-2xl text-[var(--deep-wine)]">Products & Inventory</h2><p className="text-sm text-[var(--muted)] mt-1">Update product price and stock directly from your admin panel.</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full md:w-72 border border-[var(--line)] bg-white rounded-full px-5 py-3 text-sm outline-none" /></div><div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden"><div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-4 bg-[var(--milk-sage)] border-b border-[var(--line)] text-xs uppercase tracking-wide text-[var(--muted)]"><span>Product</span><span>SKU</span><span>Price</span><span>Stock</span><span>Action</span></div>{products.map((p) => <ProductRow key={p.id} product={p} saving={saving === p.id} onSave={onSave} />)}{!products.length && <div className="px-6 py-10 text-center text-sm text-[var(--muted)]">No products found.</div>}</div></div>;
}

function ProductRow({ product, saving, onSave }: { product: Product; saving: boolean; onSave: (id: string, stock: number, price: number) => void }) {
  const [stock, setStock] = useState(String(product.stock_quantity));
  const [price, setPrice] = useState(String(product.price_inr));
  const stockNumber = Number(stock);
  const priceNumber = Number(price);
  const status = stockNumber <= 0 ? "Out of stock" : stockNumber <= 5 ? "Low stock" : "In stock";
  return <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-3 md:gap-4 px-5 md:px-6 py-5 border-b border-[var(--line)] last:border-b-0 items-center"><div><div className="font-medium text-sm text-[var(--ink)]">{product.name}</div><div className="text-xs text-[var(--muted)] capitalize mt-1">{product.category} · {product.status}</div></div><div className="text-xs text-[var(--muted)]">{product.sku}</div><div><label className="md:hidden block text-[11px] text-[var(--muted)] mb-1">Price</label><div className="flex items-center"><span className="text-sm mr-1">₹</span><input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} min="1" type="number" className="w-24 border border-[var(--line)] rounded-lg px-3 py-2 text-sm" /></div></div><div><label className="md:hidden block text-[11px] text-[var(--muted)] mb-1">Stock</label><input value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} min="0" type="number" className="w-24 border border-[var(--line)] rounded-lg px-3 py-2 text-sm" /><div className={`text-[11px] mt-1 ${stockNumber <= 0 ? "text-red-600" : stockNumber <= 5 ? "text-amber-600" : "text-green-700"}`}>{status}</div></div><button onClick={() => onSave(product.id, stockNumber, priceNumber)} disabled={saving || !Number.isInteger(stockNumber) || stockNumber < 0 || !Number.isInteger(priceNumber) || priceNumber <= 0} className="bg-[var(--deep-wine)] text-white rounded-full px-5 py-2.5 text-xs font-medium disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button></div>;
}