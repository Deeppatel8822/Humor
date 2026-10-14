"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
interface OrderItem { quantity: number; unit_price_inr: number; product?: { name?: string; sku?: string } | null; }
interface Customer { id: string; full_name: string | null; email: string | null; phone: string | null; created_at: string; isAccount?: boolean; marketingPartner?: { status: string; code?: string; businessName?: string } | null; }
interface Coupon { id: string; code: string; discount_type: string; discount_value: number; min_order_inr: number; is_active: boolean; expires_at: string | null; }
interface Order {
  id: string; order_number: string; status: string; subtotal_inr: number; discount_inr: number; shipping_inr: number; total_inr: number;
  payment_status: string; razorpay_payment_id?: string | null; tracking_number: string | null; created_at: string;
  customer?: { id?: string; full_name?: string; email?: string; phone?: string } | null;
  address?: { line1?: string; line2?: string | null; city?: string; state?: string; pincode?: string; country?: string; phone?: string } | null;
  order_items: OrderItem[];
}
const STAGES = [
  { key: "new", label: "New Orders" }, { key: "packing", label: "Packing" }, { key: "ready", label: "Ready to Dispatch" },
  { key: "shipping", label: "Shipping" }, { key: "complete", label: "Complete" }, { key: "cancelled", label: "Cancelled" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];
type PartnerApplication = { userId: string; email?: string; phone?: string; application: { businessName: string; businessType?: string; gstPan: string; address: string; mobile: string; photoPaths: string[]; photoUrls?: string[]; proofUrl?: string | null; proofPath?: string; registrationFeeInr?: number; termsAccepted?: boolean; termsVersion?: string; termsAcceptedAt?: string; appliedAt: string } };
function stageFor(status: string): StageKey { if (status === "pending" || status === "paid") return "new"; if (status === "confirmed") return "packing"; if (status === "processing") return "ready"; if (status === "shipped") return "shipping"; if (status === "delivered") return "complete"; return "cancelled"; }
function stageLabel(status: string) { return STAGES.find((s) => s.key === stageFor(status))?.label ?? "Order"; }
function formatDate(value: string) { return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }

function printShippingLabel(order: Order) {
  const popup = window.open("", "humor-shipping-label", "width=900,height=700");
  if (!popup) { alert("Please allow pop-ups to print the shipping label."); return; }
  const customer = order.customer?.full_name || "Customer";
  const phone = order.customer?.phone || order.address?.phone || "";
  const address = order.address;
  const addressHtml = [address?.line1, address?.line2, address?.city, address?.state, address?.pincode, address?.country || "India"].filter(Boolean).join(", ");
  const productsHtml = order.order_items?.map((item) => `<tr><td>${item.product?.name || "Product"}</td><td>${item.quantity}</td><td>₹${item.unit_price_inr * item.quantity}</td></tr>`).join("") || "";
  popup.document.write(`<!doctype html><html><head><title>Shipping Label - ${order.order_number}</title><style>*{box-sizing:border-box}body{margin:0;padding:24px;font-family:Arial,sans-serif;color:#222;background:#fff}.label{width:100%;max-width:760px;margin:auto;border:2px solid #222;padding:28px}.brand{font-size:26px;font-weight:700;letter-spacing:2px}.small{font-size:12px;color:#666}.row{display:flex;justify-content:space-between;gap:20px}.box{border:1px solid #bbb;padding:18px;margin-top:18px}.title{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#666;margin-bottom:8px}.customer{font-size:22px;font-weight:700;margin-bottom:8px}.address{font-size:18px;line-height:1.5}.tracking{font-size:26px;font-weight:700;letter-spacing:1px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{text-align:left;border-bottom:1px solid #ddd;padding:9px 4px;font-size:14px}th{font-size:11px;text-transform:uppercase;color:#666}.total{font-size:20px;font-weight:700}button{padding:12px 20px;border:0;border-radius:999px;background:#3e1730;color:white;font-size:14px;margin-top:22px;cursor:pointer}@media print{body{padding:0}.label{max-width:none;min-height:100vh;border:2px solid #222}button{display:none}}</style></head><body><div class="label"><div class="row"><div><div class="brand">HUMOR LUXURY</div><div class="small">Beauty, thoughtfully made. · Made in India</div></div><div style="text-align:right"><div class="title">Order</div><div style="font-size:22px;font-weight:700">#${order.order_number}</div></div></div><div class="box"><div class="title">Ship To</div><div class="customer">${customer}</div><div class="address">${addressHtml}</div><div style="margin-top:8px">Phone: ${phone}</div></div><div class="box"><div class="title">Tracking / AWB</div><div class="tracking">${order.tracking_number || "TO BE UPDATED"}</div></div><div class="box"><div class="title">Items</div><table><thead><tr><th>Product</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${productsHtml}</tbody></table><div style="text-align:right;margin-top:14px" class="total">Total: ₹${order.total_inr}</div></div><div class="row" style="margin-top:18px"><div class="small">Payment: ${order.payment_status === "paid" ? "Online Paid" : "Cash on Delivery"}</div><div class="small">Order date: ${formatDate(order.created_at)}</div></div><button onclick="window.print()">Print Label</button></div></body></html>`);
  popup.document.close(); popup.focus();
}

export default function AdminPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loggedIn, setLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]); const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<"orders" | "products" | "customers" | "coupons" | "crm" | "cartActivity" | "marketingPartners">("orders");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]); const [partnerApps, setPartnerApps] = useState<PartnerApplication[]>([]); const [partnerLoading, setPartnerLoading] = useState(false); const [stage, setStage] = useState<StageKey>("new");
  const [search, setSearch] = useState(""); const [orderSearch, setOrderSearch] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [saving, setSaving] = useState<string | null>(null);
  async function loadAdminData() {
    const [productsRes, ordersRes, customersRes, couponsRes] = await Promise.all([
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
      fetch("/api/admin/customers", { cache: "no-store" }),
      fetch("/api/admin/coupons", { cache: "no-store" }),
    ]);
    if (!productsRes.ok || !ordersRes.ok) { setLoggedIn(false); return; }
    const productsData = await productsRes.json();
    const ordersData = await ordersRes.json();
    const customersData = customersRes.ok ? await customersRes.json() : { customers: [] };
    const couponsData = couponsRes.ok ? await couponsRes.json() : { coupons: [] };
    setProducts(productsData.products ?? []);
    setOrders(ordersData.orders ?? []);
    setCustomers(customersData.customers ?? []);
    setCoupons(couponsData.coupons ?? []);
    setLoggedIn(true);
  }
  useEffect(() => { loadAdminData(); const timer = window.setInterval(loadAdminData, 30000); return () => window.clearInterval(timer); }, []);
  async function loadPartnerApplications() { setPartnerLoading(true); const res = await fetch("/api/admin/marketing-partners", { cache: "no-store" }); if (res.ok) { const data = await res.json(); setPartnerApps(data.applications ?? []); } setPartnerLoading(false); }
  async function actPartner(userId: string, action: "approve" | "reject") { setSaving(userId); setError(""); const res = await fetch("/api/admin/marketing-partners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action }) }); const data = await res.json(); if (!res.ok) setError(data.error || "Could not update marketing partner."); else setPartnerApps((prev) => prev.filter((app) => app.userId !== userId)); setSaving(null); }
  async function login(e: React.FormEvent) { e.preventDefault(); setLoading(true); setError(""); const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); const data = await res.json(); if (!res.ok) setError(data.error || "Login failed."); else await loadAdminData(); setLoading(false); }
  async function saveProduct(id: string, stock: number, price: number) { setSaving(id); setError(""); const res = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, stock_quantity: stock, price_inr: price }) }); const data = await res.json(); if (!res.ok) setError(data.error || "Could not update product."); else setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock_quantity: data.product.stock_quantity, price_inr: data.product.price_inr } : p)); setSaving(null); }
  async function moveOrder(id: string, nextStatus: string, trackingNumber?: string) { setSaving(id); setError(""); const res = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: nextStatus, tracking_number: trackingNumber ?? undefined }) }); const data = await res.json(); if (!res.ok) setError(data.error || "Could not update order."); else { setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: data.order.status, tracking_number: data.order.tracking_number } : o)); if (nextStatus === "shipped") setStage("shipping"); } setSaving(null); }
  async function recordCompletedRefund(order: Order) {
    if (!window.confirm("Only continue if the actual refund has already completed in Razorpay. This action does not send money. Continue?")) return;
    const refundReference = window.prompt("Enter the completed Razorpay refund ID/reference:");
    if (!refundReference?.trim()) return;
    setSaving(order.id);
    setError("");
    try {
      const response = await fetch("/api/admin/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: order.order_number, refund_reference: refundReference.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not record the completed refund.");
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, payment_status: "refunded" } : item));
      if (data.warning) window.alert(data.warning);
      else window.alert(data.message || "Refund recorded.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record the completed refund.");
    } finally {
      setSaving(null);
    }
  }
  const filteredProducts = products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = useMemo(() => { const q = orderSearch.toLowerCase(); return orders.filter((o) => stageFor(o.status) === stage).filter((o) => `${o.order_number} ${o.customer?.full_name ?? ""} ${o.customer?.phone ?? ""} ${o.customer?.email ?? ""}`.toLowerCase().includes(q)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); }, [orders, stage, orderSearch]);
  const stageCounts = useMemo(() => STAGES.reduce((acc, s) => ({ ...acc, [s.key]: orders.filter((o) => stageFor(o.status) === s.key).length }), {} as Record<StageKey, number>), [orders]);
  const newCount = stageCounts.new || 0;

  if (!loggedIn) return <><style>{`body:has([data-admin-panel]) header, body:has([data-admin-panel]) footer, body:has([data-admin-panel]) a[aria-label="Chat with Humor Luxury on WhatsApp"] { display: none !important; }`}</style><main data-admin-panel className="min-h-[70vh] bg-[var(--milk-sage)] flex items-center justify-center px-5 py-16"><form onSubmit={login} className="w-full max-w-md bg-white rounded-3xl border border-[var(--line)] p-8 md:p-10 shadow-sm"><p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-3">Humor Luxury</p><h1 className="font-display text-3xl text-[var(--deep-wine)]">Admin Login</h1><p className="text-sm text-[var(--muted)] mt-2 mb-8">Manage orders, products and inventory securely.</p><label className="block text-xs font-medium text-[var(--ink)] mb-2">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-5 outline-none" /><label className="block text-xs font-medium text-[var(--ink)] mb-2">Password</label><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full border border-[var(--line)] rounded-xl px-4 py-3 mb-5 outline-none" />{error && <p className="text-sm text-red-600 mb-4">{error}</p>}<button disabled={loading} className="w-full bg-[var(--deep-wine)] text-white rounded-full py-3.5 text-sm font-medium disabled:opacity-50">{loading ? "Signing in…" : "Sign in"}</button></form></main></>;

  return <><style>{`body:has([data-admin-panel]) header, body:has([data-admin-panel]) footer, body:has([data-admin-panel]) a[aria-label="Chat with Humor Luxury on WhatsApp"] { display: none !important; }`}</style><main data-admin-panel className="min-h-[70vh] bg-[var(--milk-sage)] px-5 md:px-8 py-10 md:py-14"><div className="max-w-7xl mx-auto"><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-7"><div><p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)] mb-2">Humor Luxury</p><h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)]">Admin Panel</h1><p className="text-sm text-[var(--muted)] mt-2">Orders move from New → Packing → Ready to Dispatch → Shipping → Complete.</p></div><button onClick={loadAdminData} className="self-start md:self-auto border border-[var(--line)] bg-white rounded-full px-5 py-2.5 text-xs font-medium">Refresh</button></div><div className="flex flex-wrap gap-2 mb-6">
<button onClick={() => setTab("orders")} className={`rounded-full px-5 md:px-6 py-3 text-sm font-medium ${tab === "orders" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Orders {newCount > 0 && <span className="ml-1 inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px]">{newCount}</span>}</button>
<button onClick={() => setTab("products")} className={`rounded-full px-5 md:px-6 py-3 text-sm font-medium ${tab === "products" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Products & Inventory</button>
<button onClick={() => setTab("customers")} className={`rounded-full px-5 md:px-6 py-3 text-sm font-medium ${tab === "customers" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Customers <span className="ml-1 text-[10px] opacity-70">{customers.length}</span></button>
<button onClick={() => setTab("coupons")} className={`rounded-full px-5 md:px-6 py-3 text-sm font-medium ${tab === "coupons" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Coupons <span className="ml-1 text-[10px] opacity-70">{coupons.length}</span></button><button onClick={() => setTab("crm")} className={`rounded-full px-5 md:px-6 py-3 text-sm font-medium ${tab === "crm" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Customer CRM</button><button onClick={() => setTab("cartActivity")} className={`rounded-full px-5 md:px-6 py-3 text-sm font-medium ${tab === "cartActivity" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Cart Activity</button><button onClick={() => { setTab("marketingPartners"); loadPartnerApplications(); }} className={`rounded-full px-5 md:px-6 py-3 text-sm font-medium ${tab === "marketingPartners" ? "bg-[var(--deep-wine)] text-white" : "bg-white border border-[var(--line)]"}`}>Marketing Partners {partnerApps.length > 0 && <span className="ml-1 inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px]">{partnerApps.length}</span>}</button>
</div>{error && <div className="bg-white border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}{tab === "orders" ? <div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">{STAGES.map((s) => <button key={s.key} onClick={() => setStage(s.key)} className={`text-left rounded-2xl p-4 border transition ${stage === s.key ? "bg-[var(--deep-wine)] text-white border-[var(--deep-wine)]" : "bg-white border-[var(--line)]"}`}><div className="text-xs opacity-80">{s.label}</div><div className="text-2xl font-semibold mt-1">{stageCounts[s.key] || 0}</div></button>)}</div><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5"><div><h2 className="font-display text-2xl text-[var(--deep-wine)]">{STAGES.find((s) => s.key === stage)?.label}</h2><p className="text-sm text-[var(--muted)] mt-1">Newest orders appear first.</p></div><input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search order, name, phone…" className="w-full md:w-80 border border-[var(--line)] bg-white rounded-full px-5 py-3 text-sm outline-none" /></div><div className="space-y-4">{filteredOrders.map((order) => <OrderCard key={order.id} order={order} saving={saving === order.id} onMove={moveOrder} onPrint={() => printShippingLabel(order)} onRefund={recordCompletedRefund} />)}{!filteredOrders.length && <div className="bg-white rounded-2xl border border-[var(--line)] px-6 py-12 text-center text-sm text-[var(--muted)]">No orders in this stage.</div>}</div></div> : tab === "products" ? <ProductsSection products={filteredProducts} search={search} setSearch={setSearch} saving={saving} onSave={saveProduct} /> : tab === "customers" ? <CustomersSection customers={customers} orders={orders} /> : tab === "coupons" ? <CouponsSection coupons={coupons} /> : tab === "crm" ? <CustomerCrmSection /> : tab === "cartActivity" ? <CartActivitySection /> : <MarketingPartnersSection applications={partnerApps} loading={partnerLoading} saving={saving} onRefresh={loadPartnerApplications} onAction={actPartner} />}</div></main></>;
}

function OrderCard({ order, saving, onMove, onPrint, onRefund }: { order: Order; saving: boolean; onMove: (id: string, status: string, tracking?: string) => void; onPrint: () => void; onRefund: (order: Order) => void }) {
  const stage = stageFor(order.status); const [tracking, setTracking] = useState(order.tracking_number ?? ""); const customer = order.customer; const address = order.address;
  return <div className={`bg-white rounded-2xl border p-5 md:p-6 ${stage === "new" ? "border-red-300 shadow-sm" : "border-[var(--line)]"}`}><div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 mb-3"><span className="font-semibold text-lg text-[var(--deep-wine)]">#{order.order_number}</span>{stage === "new" && <span className="text-[11px] uppercase tracking-wide rounded-full px-3 py-1 bg-red-100 text-red-700 font-semibold">NEW ORDER</span>}<span className={`text-[11px] uppercase tracking-wide rounded-full px-3 py-1 ${order.payment_status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{order.payment_status === "paid" ? "Paid" : "COD / Unpaid"}</span><span className="text-xs text-[var(--muted)]">{formatDate(order.created_at)}</span></div><div className="grid md:grid-cols-2 gap-5 text-sm"><div><p className="font-medium">{customer?.full_name || "Guest Customer"}</p><p className="text-[var(--muted)] mt-1">{customer?.phone || address?.phone || "No phone"}</p><p className="text-[var(--muted)]">{customer?.email || "No email"}</p></div><div className="text-[var(--muted)] leading-6"><p>{address?.line1}{address?.line2 ? `, ${address.line2}` : ""}</p><p>{address?.city}, {address?.state} - {address?.pincode}</p><p>{address?.country || "India"}</p></div></div></div><div className="lg:text-right shrink-0"><p className="text-xs text-[var(--muted)]">Order total</p><p className="text-2xl font-semibold text-[var(--deep-wine)]">₹{order.total_inr}</p><p className="text-xs text-[var(--muted)] mt-1">{stageLabel(order.status)}</p></div></div><div className="mt-5 border-t border-[var(--line)] pt-5"><p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-3">Products</p><div className="space-y-2">{order.order_items?.map((item, index) => <div key={index} className="flex justify-between gap-4 text-sm"><span>{item.product?.name || "Product"} <span className="text-[var(--muted)]">× {item.quantity}</span></span><span className="font-medium">₹{item.unit_price_inr * item.quantity}</span></div>)}</div></div><div className="mt-5 border-t border-[var(--line)] pt-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div className="flex flex-wrap gap-2">{stage === "new" && <button onClick={() => onMove(order.id, "confirmed")} disabled={saving} className="bg-[var(--deep-wine)] text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "✓ Accept Order"}</button>}{stage === "packing" && <button onClick={() => onMove(order.id, "processing")} disabled={saving} className="bg-[var(--deep-wine)] text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "✓ Ready for Dispatch"}</button>}{stage === "ready" && <button onClick={() => onMove(order.id, "shipped")} disabled={saving} className="bg-[var(--deep-wine)] text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50">{saving ? "Dispatching…" : "🚚 Move to Shipping"}</button>}{stage === "shipping" && <><button onClick={onPrint} className="border border-[var(--deep-wine)] text-[var(--deep-wine)] bg-white rounded-full px-6 py-3 text-sm font-medium">🖨 Print Shipping Label</button><button onClick={() => onMove(order.id, "delivered", tracking)} disabled={saving} className="bg-[var(--deep-wine)] text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "✓ Mark Delivered"}</button></>}{stage === "complete" && <div className="text-sm font-medium text-green-700">✓ Order completed</div>}{stage === "cancelled" && <div className="text-sm font-medium text-red-600">Order cancelled</div>}{order.payment_status === "paid" && order.razorpay_payment_id && <button onClick={() => onRefund(order)} disabled={saving} className="rounded-full border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-800 disabled:opacity-50">{saving ? "Recording…" : "Record completed refund"}</button>}{order.payment_status === "refunded" && <span className="text-sm font-semibold text-amber-800">Refund recorded</span>}</div>{stage === "shipping" && <div className="w-full md:w-80"><label className="block text-xs text-[var(--muted)] mb-2">Tracking / AWB Number</label><input value={tracking} onChange={(e) => setTracking(e.target.value)} onBlur={() => tracking !== (order.tracking_number ?? "") && onMove(order.id, "shipped", tracking)} placeholder="Enter AWB / tracking number" className="w-full border border-[var(--line)] rounded-xl px-4 py-3 text-sm outline-none" /></div>}</div></div>;
}

function ProductsSection({ products, search, setSearch, saving, onSave }: { products: Product[]; search: string; setSearch: (v: string) => void; saving: string | null; onSave: (id: string, stock: number, price: number) => void }) { return <div><div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-5"><div><h2 className="font-display text-2xl text-[var(--deep-wine)]">Products & Inventory</h2><p className="text-sm text-[var(--muted)] mt-1">Update product price and stock directly from your admin panel.</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="w-full md:w-72 border border-[var(--line)] bg-white rounded-full px-5 py-3 text-sm outline-none" /></div><div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden"><div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-4 px-6 py-4 bg-[var(--milk-sage)] border-b border-[var(--line)] text-xs uppercase tracking-wide text-[var(--muted)]"><span>Product</span><span>SKU</span><span>Price</span><span>Stock</span><span>Action</span></div>{products.map((p) => <ProductRow key={p.id} product={p} saving={saving === p.id} onSave={onSave} />)}{!products.length && <div className="px-6 py-10 text-center text-sm text-[var(--muted)]">No products found.</div>}</div></div>; }
function ProductRow({ product, saving, onSave }: { product: Product; saving: boolean; onSave: (id: string, stock: number, price: number) => void }) { const [stock, setStock] = useState(String(product.stock_quantity)); const [price, setPrice] = useState(String(product.price_inr)); const stockNumber = Number(stock); const priceNumber = Number(price); const status = stockNumber <= 0 ? "Out of stock" : stockNumber <= 5 ? "Low stock" : "In stock"; return <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-3 md:gap-4 px-5 md:px-6 py-5 border-b border-[var(--line)] last:border-b-0 items-center"><div><div className="font-medium text-sm text-[var(--ink)]">{product.name}</div><div className="text-xs text-[var(--muted)] capitalize mt-1">{product.category} · {product.status}</div></div><div className="text-xs text-[var(--muted)]">{product.sku}</div><div><label className="md:hidden block text-[11px] text-[var(--muted)] mb-1">Price</label><div className="flex items-center"><span className="text-sm mr-1">₹</span><input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} min="1" type="number" className="w-24 border border-[var(--line)] rounded-lg px-3 py-2 text-sm" /></div></div><div><label className="md:hidden block text-[11px] text-[var(--muted)] mb-1">Stock</label><input value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} min="0" type="number" className="w-24 border border-[var(--line)] rounded-lg px-3 py-2 text-sm" /><div className={`text-[11px] mt-1 ${stockNumber <= 0 ? "text-red-600" : stockNumber <= 5 ? "text-amber-600" : "text-green-700"}`}>{status}</div></div><button onClick={() => onSave(product.id, stockNumber, priceNumber)} disabled={saving || !Number.isInteger(stockNumber) || stockNumber < 0 || !Number.isInteger(priceNumber) || priceNumber <= 0} className="bg-[var(--deep-wine)] text-white rounded-full px-5 py-2.5 text-xs font-medium disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button></div>; }

function MarketingPartnersSection({ applications, loading, saving, onRefresh, onAction }: { applications: PartnerApplication[]; loading: boolean; saving: string | null; onRefresh: () => void; onAction: (userId: string, action: "approve" | "reject") => void }) {
  return <div>
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-5"><div><h2 className="font-display text-2xl text-[var(--deep-wine)]">Marketing Partner Applications</h2><p className="text-sm text-[var(--muted)] mt-1">Review submitted business details and verify partners before generating their code.</p></div><button onClick={onRefresh} className="self-start border border-[var(--line)] bg-white rounded-full px-5 py-2.5 text-xs">Refresh</button></div>
    {loading ? <div className="bg-white rounded-2xl border border-[var(--line)] p-10 text-center text-sm text-[var(--muted)]">Loading applications…</div> : !applications.length ? <div className="bg-white rounded-2xl border border-[var(--line)] p-10 text-center text-sm text-[var(--muted)]">No pending applications.</div> : <div className="space-y-5">{applications.map((app) => <div key={app.userId} className="bg-white rounded-2xl border border-[var(--line)] p-5 md:p-6"><div className="grid md:grid-cols-2 gap-6"><div><p className="text-xs text-[var(--muted)]">Business</p><h3 className="font-display text-2xl text-[var(--deep-wine)] mt-1">{app.application.businessName}</h3><p className="text-sm mt-4"><strong>Type:</strong> {app.application.businessType || "Marketing Partner"}</p><p className="text-sm mt-1"><strong>GST / PAN:</strong> {app.application.gstPan || "Not provided"}</p><p className="text-sm mt-1"><strong>Mobile:</strong> {app.application.mobile}</p><p className="text-sm mt-1"><strong>Registration fee:</strong> ₹{app.application.registrationFeeInr ?? 9} paid</p><p className="text-sm mt-1"><strong>Terms accepted:</strong> {app.application.termsAccepted ? `Yes (${app.application.termsVersion || "version not recorded"})` : "Legacy application"}</p><p className="text-sm mt-1"><strong>Account:</strong> {app.email || app.phone || "—"}</p></div><div><p className="text-xs text-[var(--muted)]">Business address</p><p className="text-sm leading-6 mt-1">{app.application.address}</p><p className="text-xs text-[var(--muted)] mt-4 mb-2">Business proof</p>{app.application.proofUrl ? <a href={app.application.proofUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-[var(--line)] px-4 py-2 text-xs font-medium text-[var(--deep-wine)] underline">View uploaded proof ↗</a> : <div className="flex gap-2 flex-wrap">{(app.application.photoUrls || []).map((url, i) => <img key={url} src={url} alt={"Business photo " + (i + 1)} className="h-24 w-24 rounded-xl object-cover border border-[var(--line)]" />)}</div>}</div></div><div className="mt-6 flex flex-col sm:flex-row gap-3"><button disabled={!!saving} onClick={() => onAction(app.userId, "approve")} className="rounded-full bg-[var(--deep-wine)] text-white px-6 py-3 text-sm font-medium disabled:opacity-50">{saving === app.userId ? "Processing…" : "Approve & Generate Code"}</button><button disabled={!!saving} onClick={() => onAction(app.userId, "reject")} className="rounded-full border border-red-200 text-red-700 px-6 py-3 text-sm font-medium disabled:opacity-50">Reject</button></div></div>)}</div>}
  </div>;
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}
function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function CustomersSection({ customers, orders }: { customers: Customer[]; orders: Order[] }) {
  const [view, setView] = useState<"registered" | "guest">("registered");
  const [customerSearch, setCustomerSearch] = useState("");
  const registered = customers.filter((customer) => customer.isAccount);
  const registeredIds = new Set(registered.map((customer) => customer.id));
  const registeredOrders = orders.filter((order) => !!order.customer?.id && registeredIds.has(order.customer.id));
  const guestOrders = orders.filter((order) => !order.customer?.id || !registeredIds.has(order.customer.id));
  const matches = (value: string) => value.toLowerCase().includes(customerSearch.toLowerCase().trim());
  const visibleCustomers = registered.filter((customer) => matches(`${customer.full_name || ""} ${customer.email || ""} ${customer.phone || ""}`));
  const guestGroups = new Map<string, { key: string; name: string; email: string; phone: string; orders: Order[] }>();
  for (const order of guestOrders) {
    const email = (order.customer?.email || "").trim().toLowerCase();
    const phone = (order.customer?.phone || order.address?.phone || "").replace(/\\D/g, "");
    const key = email ? `email:${email}` : phone ? `phone:${phone}` : `order:${order.id}`;
    const existing = guestGroups.get(key);
    if (existing) existing.orders.push(order);
    else guestGroups.set(key, {
      key,
      name: order.customer?.full_name || "Guest Customer",
      email: order.customer?.email || "",
      phone: order.customer?.phone || order.address?.phone || "",
      orders: [order],
    });
  }
  const allGuestCustomers = Array.from(guestGroups.values()).map((group) => ({
    ...group,
    orders: group.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  }));
  const visibleGuestCustomers = allGuestCustomers.filter((group) => matches(`${group.name} ${group.email} ${group.phone} ${group.orders.map((order) => order.order_number).join(" ")} ${group.orders.map((order) => order.address?.city || "").join(" ")}`));
  const ordersForCustomer = (customerId: string) => registeredOrders.filter((order) => order.customer?.id === customerId);
  const registeredCsv = () => downloadCsv("humor-registered-customers.csv",
    ["Customer ID", "Name", "Email", "Mobile", "Joined", "Order Count", "Total Purchase INR", "Order Numbers", "Order Dates", "Order Statuses", "Products Purchased", "Payment Statuses"],
    visibleCustomers.map((customer) => {
      const customerOrders = ordersForCustomer(customer.id);
      return [customer.id, customer.full_name, customer.email, customer.phone, customer.created_at, customerOrders.length,
        customerOrders.reduce((sum, order) => sum + Number(order.total_inr || 0), 0),
        customerOrders.map((order) => order.order_number).join(" | "),
        customerOrders.map((order) => formatDate(order.created_at)).join(" | "),
        customerOrders.map((order) => order.status).join(" | "),
        customerOrders.map((order) => order.order_items?.map((item) => `${item.product?.name || "Product"} x${item.quantity}`).join(", ")).join(" | "),
        customerOrders.map((order) => order.payment_status).join(" | ")];
    }));
  const guestCsv = () => downloadCsv(
    "humor-guest-customers-purchase-history.csv",
    ["Customer Name", "Email", "Mobile", "Order Count", "Lifetime Purchase INR", "Order Numbers", "Purchase Dates", "Products Purchased", "Order Totals INR", "Payment Statuses", "Order Statuses", "Delivery Addresses", "Tracking Numbers"],
    visibleGuestCustomers.map((group) => {
      return [
        group.name,
        group.email,
        group.phone,
        group.orders.length,
        group.orders.reduce((sum, order) => sum + Number(order.total_inr || 0), 0),
        group.orders.map((order) => order.order_number).join(" | "),
        group.orders.map((order) => formatDate(order.created_at)).join(" | "),
        group.orders.map((order) => order.order_items?.map((item) => `${item.product?.name || "Product"} x${item.quantity}`).join(", ")).join(" | "),
        group.orders.map((order) => order.total_inr).join(" | "),
        group.orders.map((order) => order.payment_status).join(" | "),
        group.orders.map((order) => order.status).join(" | "),
        group.orders.map((order) => [order.address?.line1, order.address?.line2, order.address?.city, order.address?.state, order.address?.pincode, order.address?.country || "India"].filter(Boolean).join(", ")).join(" | "),
        group.orders.map((order) => order.tracking_number || "").join(" | "),
      ];
    })
  );
  return <div className="space-y-5">
    <div className="bg-white rounded-2xl border border-[var(--line)] p-5">
      <h2 className="font-display text-2xl text-[var(--deep-wine)]">Customer Purchase Records</h2>
      <p className="text-sm text-[var(--muted)] mt-1">Registered-account purchases and guest checkout orders are separated below. Export either list as a spreadsheet-compatible CSV file.</p>
      <div className="mt-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setView("registered")} className={`rounded-full px-4 py-2.5 text-sm font-medium ${view === "registered" ? "bg-[var(--deep-wine)] text-white" : "border border-[var(--line)] bg-white"}`}>Registered Customers ({registered.length})</button>
          <button onClick={() => setView("guest")} className={`rounded-full px-4 py-2.5 text-sm font-medium ${view === "guest" ? "bg-[var(--deep-wine)] text-white" : "border border-[var(--line)] bg-white"}`}>Guest Customers ({allGuestCustomers.length})</button>
        </div>
        <input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Search name, email, phone, order…" className="w-full md:w-80 rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none" />
      </div>
    </div>
    {view === "registered" ? <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-[var(--line)]">
        <div><h3 className="font-display text-xl text-[var(--deep-wine)]">Registered Customers</h3><p className="text-xs text-[var(--muted)] mt-1">Account details, order history and total spend.</p></div>
        <button onClick={registeredCsv} className="rounded-full bg-[var(--deep-wine)] px-5 py-2.5 text-sm font-semibold text-white">Download Registered CSV</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--line)] bg-[var(--milk-sage)] text-left text-xs uppercase tracking-wide text-[var(--muted)]"><th className="p-4">Customer</th><th className="p-4">Contact</th><th className="p-4">Joined</th><th className="p-4">Orders</th><th className="p-4">Total Spend</th><th className="p-4">Purchase History</th></tr></thead><tbody>{visibleCustomers.map((customer) => { const customerOrders = ordersForCustomer(customer.id); const spend = customerOrders.reduce((sum, order) => sum + Number(order.total_inr || 0), 0); return <tr key={customer.id} className="border-b border-[var(--line)] last:border-0 align-top"><td className="p-4"><p className="font-medium">{customer.full_name || "—"}</p>{customer.marketingPartner?.status === "approved" && <span className="mt-1 inline-flex rounded-full bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700">Marketing Partner</span>}</td><td className="p-4"><p>{customer.email || "—"}</p><p className="mt-1 text-xs text-[var(--muted)]">{customer.phone || "No mobile"}</p></td><td className="p-4 whitespace-nowrap text-[var(--muted)]">{formatDate(customer.created_at)}</td><td className="p-4 font-semibold">{customerOrders.length}</td><td className="p-4 font-semibold text-[var(--deep-wine)]">₹{spend.toLocaleString("en-IN")}</td><td className="p-4 min-w-64">{customerOrders.length ? <div className="space-y-2">{customerOrders.map((order) => <div key={order.id} className="rounded-xl border border-[var(--line)] p-3"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">#{order.order_number}</span><span>₹{order.total_inr}</span></div><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(order.created_at)} · {order.status} · {order.payment_status}</p><p className="mt-2 text-xs">{order.order_items?.map((item) => `${item.product?.name || "Product"} × ${item.quantity}`).join(", ")}</p></div>)}</div> : <span className="text-xs text-[var(--muted)]">No purchases yet</span>}</td></tr>; })}{!visibleCustomers.length && <tr><td colSpan={6} className="p-10 text-center text-sm text-[var(--muted)]">No registered customers match this search.</td></tr>}</tbody></table></div>
    </div> : <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-[var(--line)]">
        <div><h3 className="font-display text-xl text-[var(--deep-wine)]">Guest Checkout Purchases</h3><p className="text-xs text-[var(--muted)] mt-1">One row per customer, grouped by email or mobile, with their complete purchase history.</p></div>
        <button onClick={guestCsv} className="rounded-full bg-[var(--deep-wine)] px-5 py-2.5 text-sm font-semibold text-white">Download Customer-wise CSV</button>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--line)] bg-[var(--milk-sage)] text-left text-xs uppercase tracking-wide text-[var(--muted)]"><th className="p-4">Customer / Contact</th><th className="p-4">Orders</th><th className="p-4">Total Spend</th><th className="p-4">Full Purchase History</th></tr></thead><tbody>{visibleGuestCustomers.map((group) => <tr key={group.key} className="border-b border-[var(--line)] last:border-0 align-top"><td className="p-4 min-w-48"><p className="font-semibold">{group.name}</p><p className="mt-1 break-all">{group.email || "No email"}</p><p className="mt-1 text-xs text-[var(--muted)]">{group.phone || "No mobile"}</p></td><td className="p-4 font-semibold">{group.orders.length}</td><td className="p-4 font-semibold text-[var(--deep-wine)]">₹{group.orders.reduce((sum, order) => sum + Number(order.total_inr || 0), 0).toLocaleString("en-IN")}</td><td className="p-4 min-w-80"><div className="space-y-3">{group.orders.map((order) => <div key={order.id} className="rounded-xl border border-[var(--line)] p-3"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">#{order.order_number}</span><span className="font-semibold text-[var(--deep-wine)]">₹{order.total_inr}</span></div><p className="mt-1 text-xs text-[var(--muted)]">{formatDate(order.created_at)} · {order.payment_status} · {order.status}</p><div className="mt-2 space-y-1 text-xs">{order.order_items?.map((item, index) => <p key={index}>{item.product?.name || "Product"} × {item.quantity} · ₹{item.unit_price_inr * item.quantity}</p>)}</div><p className="mt-2 text-xs text-[var(--muted)]">Delivery: {[order.address?.line1, order.address?.line2, order.address?.city, order.address?.state, order.address?.pincode].filter(Boolean).join(", ") || "—"}</p>{order.tracking_number && <p className="mt-1 text-xs text-[var(--muted)]">Tracking: {order.tracking_number}</p>}</div>)}</div></td></tr>)}{!visibleGuestCustomers.length && <tr><td colSpan={4} className="p-10 text-center text-sm text-[var(--muted)]">No guest customers match this search.</td></tr>}</tbody></table></div>
    </div>}
  </div>;
}

function CouponsSection({ coupons }: { coupons: Coupon[] }) {
  return <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
    <div className="p-5 border-b border-[var(--line)]"><h2 className="font-display text-2xl text-[var(--deep-wine)]">Coupons</h2><p className="text-sm text-[var(--muted)] mt-1">Coupon monitoring is ready. Coupon creation/generation can be added separately.</p></div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--line)] text-left text-xs uppercase tracking-wide text-[var(--muted)]"><th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Min Order</th><th className="p-4">Status</th><th className="p-4">Expiry</th></tr></thead><tbody>{coupons.map((c) => <tr key={c.id} className="border-b border-[var(--line)] last:border-0"><td className="p-4 font-semibold">{c.code}</td><td className="p-4">{c.discount_type === "percentage" ? c.discount_value + "%" : "₹" + c.discount_value}</td><td className="p-4">₹{c.min_order_inr}</td><td className="p-4">{c.is_active ? <span className="text-green-700">Active</span> : <span className="text-red-600">Inactive</span>}</td><td className="p-4 text-[var(--muted)]">{c.expires_at ? formatDate(c.expires_at) : "No expiry"}</td></tr>)}{!coupons.length && <tr><td colSpan={5} className="p-10 text-center text-[var(--muted)]">No coupons found.</td></tr>}</tbody></table></div>
  </div>;
}


type CrmProduct = { id: string; name: string; slug: string; category: string; status: string };
type CrmSetting = { product_id: string; reminder_after_days: number; is_enabled: boolean };
type CrmConsent = { id: string; phone_e164: string; customer_name: string | null; email: string | null; consent_status: string; consent_source: string | null; consent_at: string | null };
type CrmReminder = { id: string; customer_name: string | null; phone_e164: string; product_name: string; due_at: string; status: string; message: string | null; sent_at: string | null; error_message: string | null };

function CustomerCrmSection() {
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [settings, setSettings] = useState<CrmSetting[]>([]);
  const [consents, setConsents] = useState<CrmConsent[]>([]);
  const [reminders, setReminders] = useState<CrmReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [consentStatus, setConsentStatus] = useState("opted_in");
  const [consentSource, setConsentSource] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/customer-crm", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load customer CRM.");
      setProducts(data.products || []); setSettings(data.settings || []);
      setConsents(data.consents || []); setReminders(data.reminders || []);
      setWhatsappConfigured(Boolean(data.whatsappConfigured));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load customer CRM."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function settingFor(productId: string) {
    return settings.find((item) => item.product_id === productId) || { product_id: productId, reminder_after_days: 30, is_enabled: true };
  }
  async function saveSetting(productId: string, days: number, enabled: boolean) {
    setSaving(productId); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/customer-crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_setting", product_id: productId, reminder_after_days: days, is_enabled: enabled }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save reminder setting.");
      setSettings((old) => [...old.filter((x) => x.product_id !== productId), data.setting]);
      setNotice("Product reminder settings saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save setting."); }
    finally { setSaving(null); }
  }
  async function saveConsent(e: React.FormEvent) {
    e.preventDefault(); setSaving("consent"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/customer-crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_consent", phone_e164: phone, customer_name: name, email: contactEmail, consent_status: consentStatus, consent_source: consentSource }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save WhatsApp preference.");
      setPhone(""); setName(""); setContactEmail(""); setConsentSource("");
      setNotice("WhatsApp preference saved."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save consent."); }
    finally { setSaving(null); }
  }
  async function generateDue() {
    setSaving("generate"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/customer-crm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate_due" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not calculate due reminders.");
      setNotice("Checked " + data.checked + " due reminder candidates. Newly queued: " + data.created + ". No WhatsApp messages were sent.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not generate reminders."); }
    finally { setSaving(null); }
  }
  const dueCount = reminders.filter((r) => r.status === "pending" || r.status === "ready").length;
  return <div className="space-y-5">
    <div className="bg-white rounded-2xl border border-[var(--line)] p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
        <div><h2 className="font-display text-2xl text-[var(--deep-wine)]">Customer Repeat-Purchase CRM</h2><p className="text-sm text-[var(--muted)] mt-1">Product-wise reorder intervals, recorded WhatsApp consent and reminder queue.</p></div>
        <button onClick={() => void load()} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm">Refresh</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        <div className="rounded-xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">WhatsApp opt-ins</p><p className="text-2xl font-semibold mt-1">{consents.filter((c) => c.consent_status === "opted_in").length}</p></div>
        <div className="rounded-xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Pending reminders</p><p className="text-2xl font-semibold mt-1">{dueCount}</p></div>
        <div className="rounded-xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">WhatsApp provider</p><p className="text-sm font-semibold mt-2">{whatsappConfigured ? "Credentials detected" : "Not connected"}</p></div>
      </div>
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {loading && <p className="mt-4 text-sm text-[var(--muted)]">Loading CRM…</p>}
    </div>
    <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
      <div className="p-5 border-b border-[var(--line)]"><h3 className="font-display text-xl text-[var(--deep-wine)]">Product-wise reminder timing</h3><p className="text-xs text-[var(--muted)] mt-1">Set when a customer should be considered due to reorder after a delivered order.</p></div>
      <div className="divide-y divide-[var(--line)]">{products.map((product) => {
        const current = settingFor(product.id);
        return <div key={product.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 min-w-0"><p className="font-medium">{product.name}</p><p className="text-xs text-[var(--muted)] mt-1">{product.category} · {product.status}</p></div>
          <label className="text-sm flex items-center gap-2">After <input aria-label={"Reminder days for " + product.name} type="number" min={1} max={365} defaultValue={current.reminder_after_days} key={product.id + "-" + current.reminder_after_days} id={"crm-days-" + product.id} className="w-20 rounded-lg border border-[var(--line)] px-3 py-2" /> days</label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" defaultChecked={current.is_enabled} key={product.id + "-enabled-" + current.is_enabled} id={"crm-enabled-" + product.id} /> Enabled</label>
          <button disabled={saving === product.id} onClick={() => {
            const days = Number((document.getElementById("crm-days-" + product.id) as HTMLInputElement | null)?.value || 30);
            const enabled = Boolean((document.getElementById("crm-enabled-" + product.id) as HTMLInputElement | null)?.checked);
            saveSetting(product.id, days, enabled);
          }} className="rounded-full bg-[var(--deep-wine)] text-white px-4 py-2 text-sm disabled:opacity-50">{saving === product.id ? "Saving…" : "Save"}</button>
        </div>;
      })}{!products.length && !loading && <p className="p-6 text-sm text-[var(--muted)]">No products found.</p>}</div>
    </div>
    <div className="bg-white rounded-2xl border border-[var(--line)] p-5 md:p-6">
      <h3 className="font-display text-xl text-[var(--deep-wine)]">WhatsApp consent</h3>
      <p className="text-xs text-[var(--muted)] mt-1 mb-4">Only customers who explicitly opted in can enter the reminder queue. Record the source of consent, for example checkout checkbox or customer message.</p>
      <form onSubmit={saveConsent} className="grid md:grid-cols-2 gap-3">
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number, e.g. +91 98765 43210" className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm" />
        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email (optional)" className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm" />
        <select value={consentStatus} onChange={(e) => setConsentStatus(e.target.value)} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm"><option value="opted_in">Opted in</option><option value="opted_out">Opted out</option><option value="unknown">Unknown / no consent</option></select>
        <input value={consentSource} onChange={(e) => setConsentSource(e.target.value)} placeholder="Consent source / record (required for opt-in)" className="md:col-span-2 rounded-xl border border-[var(--line)] px-4 py-3 text-sm" />
        <button disabled={saving === "consent"} className="md:col-span-2 rounded-full bg-[var(--deep-wine)] text-white px-5 py-3 text-sm font-semibold disabled:opacity-50">{saving === "consent" ? "Saving…" : "Save customer WhatsApp preference"}</button>
      </form>
      <div className="overflow-x-auto mt-5"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--line)] text-left text-xs uppercase text-[var(--muted)]"><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Consent</th><th className="p-3">Source</th></tr></thead><tbody>{consents.map((item) => <tr key={item.id} className="border-b border-[var(--line)]"><td className="p-3">{item.customer_name || item.email || "Customer"}</td><td className="p-3">{item.phone_e164}</td><td className="p-3">{item.consent_status}</td><td className="p-3">{item.consent_source || "—"}</td></tr>)}{!consents.length && <tr><td colSpan={4} className="p-5 text-center text-[var(--muted)]">No WhatsApp preferences recorded yet.</td></tr>}</tbody></table></div>
    </div>
    <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
      <div className="p-5 border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h3 className="font-display text-xl text-[var(--deep-wine)]">Reorder reminders</h3><p className="text-xs text-[var(--muted)] mt-1">Calculates reminders from delivered orders and product intervals.</p></div><button onClick={generateDue} disabled={saving === "generate"} className="rounded-full bg-[var(--deep-wine)] text-white px-5 py-2.5 text-sm disabled:opacity-50">{saving === "generate" ? "Checking…" : "Generate due reminders"}</button></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--line)] text-left text-xs uppercase text-[var(--muted)]"><th className="p-3">Customer</th><th className="p-3">Product</th><th className="p-3">Due date</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{reminders.map((reminder) => <tr key={reminder.id} className="border-b border-[var(--line)] align-top"><td className="p-3">{reminder.customer_name || "Customer"}<p className="text-xs text-[var(--muted)] mt-1">{reminder.phone_e164}</p></td><td className="p-3">{reminder.product_name}</td><td className="p-3 whitespace-nowrap">{formatDate(reminder.due_at)}</td><td className="p-3">{reminder.status}</td><td className="p-3">{reminder.status === "pending" || reminder.status === "ready" ? <a href={"https://wa.me/" + reminder.phone_e164.replace(/\D/g, "") + "?text=" + encodeURIComponent(reminder.message || ("Hi, it's time to reorder " + reminder.product_name + " from Humor Luxury."))} target="_blank" rel="noreferrer" className="inline-block rounded-full border border-[var(--line)] px-3 py-2 text-xs font-medium">Open WhatsApp draft</a> : reminder.sent_at ? <span className="text-xs text-[var(--muted)]">Sent {formatDate(reminder.sent_at)}</span> : "—"}</td></tr>)}{!reminders.length && <tr><td colSpan={5} className="p-8 text-center text-[var(--muted)]">No reminders yet. Record consent, configure intervals and generate due reminders.</td></tr>}</tbody></table></div>
      <p className="p-4 text-xs text-[var(--muted)] border-t border-[var(--line)]">WhatsApp is not sending automatically yet. The current flow queues reminders and opens a prefilled WhatsApp draft for manual review. Automatic delivery requires approved WhatsApp Business Cloud API credentials, templates where required, and a verified send/opt-out webhook.</p>
    </div>
  </div>;
}


type CartEvent = { id: string; session_id: string; event_type: string; customer_name: string | null; email: string | null; phone: string | null; product_id: string | null; product_slug: string | null; product_name: string | null; unit_price_inr: number; quantity: number; cart_value_inr: number; page_path: string | null; created_at: string };
type CartOffer = { id: number; enabled: boolean; offer_code: string | null; offer_text: string; discount_label: string; expires_at: string | null; reminder_after_minutes: number };

type IntentLevel = "High intent" | "Medium intent" | "Low intent";
function scorePurchaseIntent(events: CartEvent[]) {
  const now = Date.now();
  const recent = events.filter((e) => now - new Date(e.created_at).getTime() <= 14 * 86400000);
  const count = (type: string) => recent.filter((e) => e.event_type === type).length;
  const adds = count("add_to_cart"), checkout = count("checkout_started"), views = count("product_view"), removals = count("remove_from_cart"), purchases = count("purchase_completed");
  const latest = [...recent].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime())[0];
  let score = 0;
  const reasons: string[] = [];
  if (adds) { score += Math.min(35, 20 + (adds - 1) * 5); reasons.push("Added product to cart"); }
  if (checkout) { score += 30; reasons.push("Started checkout"); }
  if (views >= 3) { score += 15; reasons.push("Viewed products repeatedly"); }
  else if (views >= 1) { score += 5; reasons.push("Viewed a product"); }
  if (removals) { score -= Math.min(15, removals * 5); reasons.push("Removed product from cart"); }
  if (purchases) { score = 0; reasons.push("Purchased in this session"); }
  if (latest && now - new Date(latest.created_at).getTime() > 3 * 86400000) score -= 10;
  score = Math.max(0, Math.min(100, score));
  const level: IntentLevel = score >= 70 ? "High intent" : score >= 40 ? "Medium intent" : "Low intent";
  return { score, level, reasons: reasons.slice(0, 3) };
}


function CartActivitySection() {
  const [events, setEvents] = useState<CartEvent[]>([]);
  const [offer, setOffer] = useState<CartOffer>({ id: 1, enabled: false, offer_code: "", offer_text: "Your cart is waiting. Complete checkout to enjoy this special offer.", discount_label: "Special offer", expires_at: "", reminder_after_minutes: 60 });
  const [optedInPhones, setOptedInPhones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");

  const polling = useRef(false);
  async function load(silent = false) {
    if (polling.current) return;
    polling.current = true;
    if (!silent) { setLoading(true); setError(""); }
    try {
      const response = await fetch("/api/admin/cart-activity", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load cart activity.");
      setEvents(data.events || []); setOptedInPhones(data.optedInPhones || []);
      // Only initialize offer settings on manual/initial loads, so polling won't overwrite edits.
      if (!silent && data.offer) setOffer({ ...data.offer, expires_at: data.offer.expires_at ? new Date(data.offer.expires_at).toISOString().slice(0,16) : "" });
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Could not load cart activity.");
    } finally {
      polling.current = false;
      if (!silent) setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { void load(true); }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  const sessions = useMemo(() => {
    const map = new Map<string, { id: string; events: CartEvent[]; latest: CartEvent; name: string; email: string; phone: string; value: number; purchased: boolean }>();
    for (const event of events) {
      let group = map.get(event.session_id);
      if (!group) {
        group = { id: event.session_id, events: [], latest: event, name: event.customer_name || "", email: event.email || "", phone: event.phone || "", value: Number(event.cart_value_inr || 0), purchased: false };
        map.set(event.session_id, group);
      }
      group.events.push(event);
      if (new Date(event.created_at).getTime() > new Date(group.latest.created_at).getTime()) group.latest = event;
      if (!group.name && event.customer_name) group.name = event.customer_name;
      if (!group.email && event.email) group.email = event.email;
      if (!group.phone && event.phone) group.phone = event.phone;
      group.value = Math.max(group.value, Number(event.cart_value_inr || 0));
    }
    return Array.from(map.values()).map((group) => {
      const sorted = [...group.events].sort((a,b) => new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
      const purchases = sorted.filter((e) => e.event_type === "purchase_completed");
      const lastPurchase = purchases[purchases.length - 1];
      const nonPurchases = sorted.filter((e) => e.event_type !== "purchase_completed");
      const latestNonPurchase = nonPurchases[nonPurchases.length - 1];
      const purchased = Boolean(lastPurchase && (!latestNonPurchase || new Date(lastPurchase.created_at) >= new Date(latestNonPurchase.created_at)));
      return { ...group, latest: sorted[sorted.length - 1] || group.latest, purchased };
    }).sort((a,b) => new Date(b.latest.created_at).getTime()-new Date(a.latest.created_at).getTime());
  }, [events]);

  const intentRanked = sessions.map((session) => ({ ...session, intent: scorePurchaseIntent(session.events) })).sort((a,b) => b.intent.score-a.intent.score);
  const abandoned = sessions.filter((session) => !session.purchased && Date.now() - new Date(session.latest.created_at).getTime() >= offer.reminder_after_minutes * 60000 && session.latest.event_type !== "cart_cleared");
  const shown = filter === "abandoned" ? abandoned : filter === "purchased" ? sessions.filter((s) => s.purchased) : sessions;

  async function saveOffer(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/cart-activity", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...offer, expires_at: offer.expires_at || null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save offer.");
      setOffer({ ...data.offer, expires_at: data.offer.expires_at ? new Date(data.offer.expires_at).toISOString().slice(0,16) : "" });
      setNotice("Abandoned-cart offer settings saved.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save offer."); }
    finally { setSaving(false); }
  }
  const money = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN");
  function waLink(session: (typeof sessions)[number]) {
    const phone = session.phone.replace(/\D/g, "");
    const expires = offer.expires_at ? new Date(offer.expires_at) : null;
    const offerValid = offer.enabled && (!expires || expires.getTime() > Date.now());
    const offerLine = offerValid ? " " + offer.offer_text + (offer.offer_code ? " Use code " + offer.offer_code + "." : "") + (expires ? " Offer valid until " + expires.toLocaleString("en-IN") + "." : "") : "";
    const msg = "Hi " + (session.name || "there") + ", you still have items waiting in your Humor Luxury cart. Complete your checkout here: https://www.humorluxury.com/cart." + offerLine + " Reply STOP if you no longer want WhatsApp reminders.";
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(msg);
  }

  return <div className="space-y-5">
    <div className="bg-white rounded-2xl border border-[var(--line)] p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3"><div><h2 className="font-display text-2xl text-[var(--deep-wine)]">Cart Activity & Recovery</h2><p className="text-sm text-[var(--muted)] mt-1">See product interest, removals, checkout starts and completed purchases. Tracking starts after this feature is deployed.</p></div><button onClick={() => void load(false)} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm">Refresh</button></div>
      <div className="grid sm:grid-cols-4 gap-3 mt-5"><div className="mt-5 rounded-xl border border-[var(--line)] p-4"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><h3 className="font-semibold text-[var(--deep-wine)]">Purchase Intent Ranking</h3><p className="text-xs text-[var(--muted)]">Rule-based score from tracked events in the last 14 days. This is a priority estimate, not a guaranteed probability.</p></div><div className="text-sm">High: {intentRanked.filter((s) => s.intent.level === "High intent" && !s.purchased).length} · Medium: {intentRanked.filter((s) => s.intent.level === "Medium intent" && !s.purchased).length}</div></div><div className="mt-3 space-y-2">{intentRanked.filter((s) => !s.purchased && s.intent.score > 0).slice(0,8).map((s) => <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border-t border-[var(--line)] pt-3"><div className="flex-1 min-w-0"><p className="text-sm font-medium">{s.name || "Anonymous visitor"} <span className="text-xs text-[var(--muted)]">{s.email || s.phone || s.id.slice(0,10)}</span></p><p className="text-xs text-[var(--muted)]">{s.intent.reasons.join(" · ")}</p></div><div className="flex items-center gap-2"><span className="text-xs font-semibold">{s.intent.score}/100</span><span className="text-xs">{s.intent.level}</span></div></div>)}{!intentRanked.some((s) => !s.purchased && s.intent.score > 0) && <p className="text-sm text-[var(--muted)] mt-3">No scored visitors yet. Scores will appear after tracked activity arrives.</p>}</div></div>
        <div className="rounded-xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Tracked sessions</p><p className="text-2xl font-semibold mt-1">{sessions.length}</p></div>
        <div className="rounded-xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Add to cart events</p><p className="text-2xl font-semibold mt-1">{events.filter((e) => e.event_type === "add_to_cart").length}</p></div>
        <div className="rounded-xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Remove events</p><p className="text-2xl font-semibold mt-1">{events.filter((e) => e.event_type === "remove_from_cart").length}</p></div>
        <div className="rounded-xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">Completed purchase sessions</p><p className="text-2xl font-semibold mt-1">{sessions.filter((s) => s.purchased).length}</p></div>
      </div>
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {loading && <p className="mt-4 text-sm text-[var(--muted)]">Loading cart activity…</p>}
    </div>
    <div className="bg-white rounded-2xl border border-[var(--line)] p-5 md:p-6">
      <h3 className="font-display text-xl text-[var(--deep-wine)]">Abandoned-cart offer</h3>
      <p className="text-xs text-[var(--muted)] mt-1 mb-4">Configure a real offer and expiry. This only prepares a WhatsApp draft; it does not send messages automatically.</p>
      <form onSubmit={saveOffer} className="grid md:grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={offer.enabled} onChange={(e) => setOffer({ ...offer, enabled: e.target.checked })} /> Enable offer in recovery drafts</label>
        <input value={offer.discount_label} onChange={(e) => setOffer({ ...offer, discount_label: e.target.value })} placeholder="Offer label, e.g. 10% off" className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm" />
        <input value={offer.offer_code || ""} onChange={(e) => setOffer({ ...offer, offer_code: e.target.value.toUpperCase() })} placeholder="Coupon code (optional)" className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm" />
        <textarea value={offer.offer_text} onChange={(e) => setOffer({ ...offer, offer_text: e.target.value })} placeholder="Offer message" className="md:col-span-2 rounded-xl border border-[var(--line)] px-4 py-3 text-sm" rows={2} />
        <label className="text-sm">Reminder after (minutes)<input type="number" min={15} max={10080} value={offer.reminder_after_minutes} onChange={(e) => setOffer({ ...offer, reminder_after_minutes: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" /></label>
        <label className="text-sm">Offer expiry (optional)<input type="datetime-local" value={offer.expires_at || ""} onChange={(e) => setOffer({ ...offer, expires_at: e.target.value })} className="mt-1 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" /></label>
        <button disabled={saving} className="md:col-span-2 rounded-full bg-[var(--deep-wine)] text-white px-5 py-3 text-sm font-semibold disabled:opacity-50">{saving ? "Saving…" : "Save recovery offer"}</button>
      </form>
    </div>
    <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
      <div className="p-5 border-b border-[var(--line)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h3 className="font-display text-xl text-[var(--deep-wine)]">Cart sessions</h3><p className="text-xs text-[var(--muted)] mt-1">Abandoned status is inferred when the latest activity is old enough and no later purchase event exists.</p></div><select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"><option value="all">All sessions</option><option value="abandoned">Abandoned carts</option><option value="purchased">Purchased</option></select></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--line)] text-left text-xs uppercase text-[var(--muted)]"><th className="p-3">Customer / session</th><th className="p-3">Last product activity</th><th className="p-3">Cart value</th><th className="p-3">Last activity</th><th className="p-3">Status / action</th></tr></thead><tbody>{shown.map((session) => {
        const items = session.events.filter((e) => e.product_name).slice(0, 4);
        const oldEnough = Date.now() - new Date(session.latest.created_at).getTime() >= offer.reminder_after_minutes * 60000;
        const canWhatsApp = Boolean(session.phone && optedInPhones.includes(session.phone.startsWith("+") ? session.phone : "+" + session.phone.replace(/\D/g, "")) && !session.purchased && oldEnough);
        return <tr key={session.id} className="border-b border-[var(--line)] align-top"><td className="p-3 min-w-48"><p className="font-medium">{session.name || "Guest visitor"}</p><p className="text-xs text-[var(--muted)] break-all">{session.email || session.phone || "Anonymous session"}</p><p className="text-[10px] text-[var(--muted)] mt-1">{session.id.slice(0, 12)}…</p></td><td className="p-3 min-w-44">{items.map((item) => <p key={item.id} className="text-xs mb-1">{item.product_name} × {item.quantity} <span className="text-[var(--muted)]">({item.event_type.replaceAll("_", " ")})</span></p>)}</td><td className="p-3 font-semibold">{money(session.value)}</td><td className="p-3 whitespace-nowrap text-xs">{formatDate(session.latest.created_at)}<p className="mt-1 text-[var(--muted)]">{session.latest.event_type.replaceAll("_", " ")}</p></td><td className="p-3">{session.purchased ? <span className="text-green-700">Purchased</span> : oldEnough ? <span className="text-amber-700">Potentially abandoned</span> : <span className="text-[var(--muted)]">Active / waiting</span>}{canWhatsApp && <a href={waLink(session)} target="_blank" rel="noreferrer" className="block mt-2 rounded-full border border-[var(--line)] px-3 py-2 text-center text-xs font-medium">Open WhatsApp draft</a>}{session.phone && !optedInPhones.includes(session.phone.startsWith("+") ? session.phone : "+" + session.phone.replace(/\D/g, "")) && <p className="mt-2 text-[10px] text-[var(--muted)]">No recorded WhatsApp opt-in</p>}</td></tr>;
      })}{!shown.length && <tr><td colSpan={5} className="p-8 text-center text-[var(--muted)]">No cart sessions match this filter yet.</td></tr>}</tbody></table></div>
    </div>
  </div>;
}
