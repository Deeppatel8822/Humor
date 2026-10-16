"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: string; slug: string; name: string; sku: string; price_inr: number; compare_at_price_inr: number | null; category: string; status: string };
type OrderItem = { product_id: string | null; bundle_id: string | null; quantity: number; unit_price_inr: number; product: { id: string; slug: string; name: string; sku: string; category: string } | null; bundle: { id: string; name: string; product_ids: string[] } | null };
type Order = { id: string; order_number: string; status: string; subtotal_inr: number; discount_inr: number; shipping_inr: number; total_inr: number; payment_status: string; created_at: string; order_items: OrderItem[] };
type CostRow = { product_id: string; purchase_cost_inr: number };
type Data = { products: Product[]; costs: CostRow[]; orders: Order[] };
const money = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number.isFinite(v) ? v : 0);
const gstRate = (category: string, name = "") => /shampoo/i.test(name) ? 0.05 : 0.18;
const netOfGst = (inclusive: number, rate: number) => inclusive / (1 + rate);
const clampPct = (v: number) => Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0));

export default function ProfitManagementPanel() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Data>({ products: [], costs: [], orders: [] });
  const [costInputs, setCostInputs] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"calculate" | "current" | "pricing">("calculate");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("0");
  const [websitePrice, setWebsitePrice] = useState("");
  const [firstDiscount, setFirstDiscount] = useState(10);
  const [bundleDiscount, setBundleDiscount] = useState(8);
  const [prepaidDiscount, setPrepaidDiscount] = useState(3);
  const [businessDiscount, setBusinessDiscount] = useState(10);
  const [applyFirstDiscount, setApplyFirstDiscount] = useState(true);
  const [applyBundleDiscount, setApplyBundleDiscount] = useState(false);
  const [applyPrepaidDiscount, setApplyPrepaidDiscount] = useState(false);
  const [applyBusinessDiscount, setApplyBusinessDiscount] = useState(false);
  const [shipping, setShipping] = useState("50");
  const [rewardRate, setRewardRate] = useState(27);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/profit/data", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Could not load profit data.");
    const d = json as Data;
    setData(d);
    const map: Record<string, string> = {};
    d.costs.forEach(c => { map[c.product_id] = String(c.purchase_cost_inr); });
    d.products.forEach(p => { if (map[p.id] === undefined) map[p.id] = "0"; });
    setCostInputs(map);
    setSelectedProduct(current => current || d.products[0]?.id || "");
    const first = d.products.find(p => p.id === selectedProduct) || d.products[0];
    if (first) setPurchaseCost(String(map[first.id] ?? "0"));
  }, [selectedProduct]);

  useEffect(() => {
    fetch("/api/profit/access", { cache: "no-store" }).then(async r => {
      const j = await r.json();
      if (r.ok && j.authenticated) { setUnlocked(true); }
    }).catch(() => {}).finally(() => setChecking(false));
  }, []);

  useEffect(() => { if (unlocked) loadData().catch(e => setError(e.message)); }, [unlocked, loadData]);

  useEffect(() => {
    const clearSession = () => {
      void fetch("/api/profit/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
        keepalive: true,
      }).catch(() => {});
    };
    const recheckOnReturn = () => {
      fetch("/api/profit/access", { cache: "no-store" })
        .then(async response => {
          const json = await response.json();
          if (!response.ok || !json.authenticated) {
            setUnlocked(false);
            setData({ products: [], costs: [], orders: [] });
          }
        })
        .catch(() => {
          setUnlocked(false);
          setData({ products: [], costs: [], orders: [] });
        });
    };
    window.addEventListener("pagehide", clearSession);
    window.addEventListener("pageshow", recheckOnReturn);
    return () => {
      window.removeEventListener("pagehide", clearSession);
      window.removeEventListener("pageshow", recheckOnReturn);
    };
  }, []);
  useEffect(() => { const p = data.products.find(x => x.id === selectedProduct); if (p) setPurchaseCost(costInputs[p.id] ?? "0"); }, [selectedProduct, data.products, costInputs]);
  useEffect(() => { const p = data.products.find(x => x.id === selectedProduct); if (p) setWebsitePrice(String(p.price_inr ?? 0)); }, [selectedProduct, data.products]);

  async function submitAccess(action: string, extra: Record<string, unknown>) {
    setBusy(true); setError(""); setNotice("");
    try {
      const res = await fetch("/api/profit/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed.");
      setNotice(json.message || "Success.");
      if (action === "login") { setUnlocked(true); setPassword(""); }
      if (action === "forgot") setShowForgot(false);
      if (action === "reset") router.replace("/admin");
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed."); return false; }
    finally { setBusy(false); }
  }

  async function saveCosts() {
    setBusy(true); setError(""); setNotice("");
    try {
      const costs = data.products.map(p => ({ product_id: p.id, purchase_cost_inr: Number(costInputs[p.id] ?? 0) }));
      const res = await fetch("/api/profit/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ costs }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save costs.");
      setNotice("All product purchase costs saved.");
      await loadData();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save costs."); }
    finally { setBusy(false); }
  }

  const selected = data.products.find(p => p.id === selectedProduct);
  const calc = useMemo(() => {
    if (!selected) return null;
    const price = Math.max(0, Number(websitePrice) || 0);
    const cogs = Math.max(0, Number(purchaseCost) || 0);
    const allRates = [firstDiscount, bundleDiscount, prepaidDiscount, businessDiscount].map(clampPct);
    const activeRates = [applyFirstDiscount, applyBundleDiscount, applyPrepaidDiscount, applyBusinessDiscount];
    const finalInclusive = allRates.reduce((amount, pct, index) => activeRates[index] ? amount * (1 - pct / 100) : amount, price);
    const maxInclusive = allRates.reduce((amount, pct) => amount * (1 - pct / 100), price);
    const gst = gstRate(selected.category, selected.name);
    const salesNet = netOfGst(finalInclusive, gst);
    const maxSalesNet = netOfGst(maxInclusive, gst);
    const shippingCost = Math.max(0, Number(shipping) || 0);
    const rewardCost = finalInclusive * clampPct(rewardRate) / 100;
    const maxRewardCost = maxInclusive * clampPct(rewardRate) / 100;
    const profit = salesNet - cogs - shippingCost - rewardCost;
    const maxProfit = maxSalesNet - cogs - shippingCost - maxRewardCost;
    return { price, cogs, gst, finalInclusive, salesNet, shippingCost, rewardCost, profit, margin: salesNet ? profit / salesNet * 100 : 0, discountAmount: price - finalInclusive, maxInclusive, maxProfit, maxRewardCost, maxMargin: maxSalesNet ? maxProfit / maxSalesNet * 100 : 0 };
  }, [selected, websitePrice, purchaseCost, firstDiscount, bundleDiscount, prepaidDiscount, businessDiscount, applyFirstDiscount, applyBundleDiscount, applyPrepaidDiscount, applyBusinessDiscount, shipping, rewardRate]);

  const orderSummary = useMemo(() => {
    const costs = new Map(data.costs.map(c => [c.product_id, Number(c.purchase_cost_inr)]));
    const productMap = new Map(data.products.map(p => [p.id, p]));
    const eligible = data.orders.filter(o => ["delivered", "shipped"].includes(String(o.status).toLowerCase()) && String(o.payment_status).toLowerCase() !== "refunded" && String(o.status).toLowerCase() !== "cancelled");
    const calcOrder = (order: Order) => {
      const rawSubtotal = Math.max(0, Number(order.subtotal_inr) || order.order_items.reduce((s, i) => s + i.unit_price_inr * i.quantity, 0));
      const discount = Math.max(0, Number(order.discount_inr) || 0);
      let salesNet = 0, cogs = 0, reward = 0, itemCount = 0;
      for (const item of order.order_items || []) {
        const qty = Math.max(0, Number(item.quantity) || 0);
        const bundleIds = item.bundle?.product_ids || [];
        if (item.product) {
          const product = productMap.get(item.product.id) || item.product as Product;
          const gross = Math.max(0, Number(item.unit_price_inr) * qty);
          const allocated = rawSubtotal > 0 ? gross * Math.max(0, rawSubtotal - discount) / rawSubtotal : 0;
          const rate = gstRate(product.category, product.name);
          salesNet += netOfGst(allocated, rate);
          cogs += (costs.get(product.id) ?? 0) * qty;
          reward += allocated * clampPct(rewardRate) / 100;
          itemCount += qty;
        } else if (bundleIds.length) {
          const bundleProducts = bundleIds.map(id => productMap.get(id)).filter(Boolean) as Product[];
          const listTotal = bundleProducts.reduce((s, p) => s + p.price_inr, 0) || 1;
          const gross = Math.max(0, Number(item.unit_price_inr) * qty);
          const allocated = rawSubtotal > 0 ? gross * Math.max(0, rawSubtotal - discount) / rawSubtotal : 0;
          for (const p of bundleProducts) {
            const share = allocated * p.price_inr / listTotal;
            salesNet += netOfGst(share, gstRate(p.category, p.name));
            cogs += (costs.get(p.id) ?? 0) * qty;
            reward += share * clampPct(rewardRate) / 100;
          }
          itemCount += qty * bundleProducts.length;
        } else {
          const gross = Math.max(0, Number(item.unit_price_inr) * qty);
          const allocated = rawSubtotal > 0 ? gross * Math.max(0, rawSubtotal - discount) / rawSubtotal : 0;
          salesNet += netOfGst(allocated, 0.18);
          reward += allocated * clampPct(rewardRate) / 100;
          itemCount += qty;
        }
      }
      const ship = 50;
      const netProfit = salesNet - cogs - ship - reward;
      return { salesNet, cogs, ship, reward, netProfit, margin: salesNet ? netProfit / salesNet * 100 : 0, itemCount };
    };
    const delivered = eligible.filter(o => String(o.status).toLowerCase() === "delivered");
    const other = eligible.filter(o => String(o.status).toLowerCase() === "shipped");
    const summarize = (orders: Order[]) => orders.reduce((a, o) => {
      const c = calcOrder(o);
      return { count: a.count + 1, sales: a.sales + c.salesNet, cogs: a.cogs + c.cogs, shipping: a.shipping + c.ship, rewards: a.rewards + c.reward, profit: a.profit + c.netProfit };
    }, { count: 0, sales: 0, cogs: 0, shipping: 0, rewards: 0, profit: 0 });
    const rows = eligible.map(o => ({ order: o, ...calcOrder(o), group: String(o.status).toLowerCase() === "delivered" ? "Delivered" : "Other fulfilled" }));
    return { delivered: summarize(delivered), other: summarize(other), total: summarize(eligible), rows };
  }, [data, rewardRate]);

  if (checking) return <div className="min-h-screen bg-[#f7f3ee] grid place-items-center text-sm text-[#6d6260]">Checking Profit Management access…</div>;

  if (!unlocked) return <div className="min-h-screen bg-[#f7f3ee] flex items-center justify-center p-5">
    <div className="w-full max-w-md rounded-3xl border border-[#e8ded7] bg-white p-8 shadow-sm">
      <p className="text-xs uppercase tracking-[0.24em] text-[#b07b35]">Humor Luxury</p>
      <h1 className="mt-3 font-display text-3xl text-[#351724]">PDPP</h1>
      <p className="mt-2 mb-7 text-sm text-[#6d6260]">Enter the section password to continue.</p>
      {!showForgot ? <form onSubmit={e => { e.preventDefault(); submitAccess("login", { password }); }}>
        <label className="mb-2 block text-sm">Section password</label>
        <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-xl border border-[#e8ded7] px-4 py-3 outline-none focus:border-[#8d6a79]" placeholder="Enter password" />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}{notice && <p className="mt-3 text-sm text-green-700">{notice}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-full bg-[#351724] py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : "Unlock section"}</button>
        <button type="button" onClick={() => { setShowForgot(true); setError(""); setNotice(""); }} className="mt-4 w-full text-sm text-[#6d6260] underline">Forgot password?</button>
      </form> : <form onSubmit={e => { e.preventDefault(); submitAccess("forgot", { email: forgotEmail }); }}>
        <label className="mb-2 block text-sm">Registered admin email</label>
        <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required className="w-full rounded-xl border border-[#e8ded7] px-4 py-3 outline-none" placeholder="Admin email" />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}{notice && <p className="mt-3 text-sm text-green-700">{notice}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-full bg-[#351724] py-3 text-sm font-semibold text-white">{busy ? "Sending…" : "Email reset link"}</button>
        <button type="button" onClick={() => setShowForgot(false)} className="mt-4 w-full text-sm text-[#6d6260] underline">Back to password</button>
      </form>}
      <p className="mt-6 text-xs leading-5 text-[#8a7e7a]">Initial password: <span className="font-semibold">Humor</span>. Change it after first access.</p>
    </div>
  </div>;

  return <div className="min-h-screen bg-[#f7f3ee] px-4 py-8 md:px-8 md:py-12">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs uppercase tracking-[0.24em] text-[#b07b35]">Humor Luxury · Admin</p><h1 className="mt-2 font-display text-3xl text-[#351724] md:text-4xl">PDPP</h1><p className="mt-2 text-sm text-[#6d6260]">Pricing, Discounts & Profit Planning. All controls are protected by the PDPP password.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => { setTab("calculate"); }} className={`rounded-full border px-4 py-2.5 text-sm ${tab === "calculate" ? "border-[#351724] bg-[#351724] text-white" : "border-[#e8ded7] bg-white text-[#351724]"}`}>Calculate Profit</button><button onClick={() => setTab("current")} className={`rounded-full border px-4 py-2.5 text-sm ${tab === "current" ? "border-[#351724] bg-[#351724] text-white" : "border-[#e8ded7] bg-white text-[#351724]"}`}>Your Current Profit</button><button onClick={() => setTab("pricing")} className={`rounded-full border px-4 py-2.5 text-sm ${tab === "pricing" ? "border-[#351724] bg-[#351724] text-white" : "border-[#e8ded7] bg-white text-[#351724]"}`}>Pricing & Discounts</button><button onClick={async () => { setBusy(true); try { await fetch("/api/profit/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); } finally { setUnlocked(false); setData({ products: [], costs: [], orders: [] }); setNotice(""); setError(""); setPassword(""); setBusy(false); } }} className="rounded-full border border-[#e8ded7] bg-white px-4 py-2.5 text-sm text-[#351724]">Lock</button></div>
      </div>
      {error && unlocked && <div className="mb-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && unlocked && <div className="mb-4 rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-800">{notice}</div>}
      {tab === "calculate" ? <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-[#e8ded7] bg-white p-5 md:p-6">
          <h2 className="font-display text-xl text-[#351724]">Scenario calculator</h2><p className="mb-5 mt-1 text-sm text-[#6d6260]">Discounts apply sequentially, matching checkout-style percentage reductions.</p>
          <label className="mb-2 block text-sm font-medium">Product</label><select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="mb-4 w-full rounded-xl border border-[#e8ded7] px-3 py-3 text-sm">{data.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          {selected && <div className="mb-4 grid grid-cols-2 gap-3"><label className="rounded-xl bg-[#f7f3ee] p-3 text-sm"><span className="block text-xs text-[#6d6260]">Proposed website price (GST inclusive ₹)</span><input type="number" min="0" step="0.01" value={websitePrice} onChange={e => setWebsitePrice(e.target.value)} className="mt-2 w-full rounded-lg border border-[#e8ded7] bg-white px-3 py-2.5 font-semibold text-[#351724]" /><span className="mt-1 block text-xs text-[#8a7e7a]">Editable for simulation only; does not change live website pricing.</span></label><div className="rounded-xl bg-[#f7f3ee] p-3"><p className="text-xs text-[#6d6260]">GST rate</p><p className="mt-1 font-semibold">{gstRate(selected.category, selected.name) * 100}%</p></div></div>}
          <label className="mb-2 block text-sm font-medium">Humor purchase cost (GST excluded)</label><input type="number" min="0" step="0.01" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} className="mb-4 w-full rounded-xl border border-[#e8ded7] px-3 py-3 text-sm" />
          <div className="space-y-3">
            {[
              { label: "First-time login discount (%)", value: firstDiscount, setter: setFirstDiscount, checked: applyFirstDiscount, toggle: setApplyFirstDiscount },
              { label: "Average bundle discount (%)", value: bundleDiscount, setter: setBundleDiscount, checked: applyBundleDiscount, toggle: setApplyBundleDiscount },
              { label: "Prepaid discount (%)", value: prepaidDiscount, setter: setPrepaidDiscount, checked: applyPrepaidDiscount, toggle: setApplyPrepaidDiscount },
              { label: "Business Programme coupon discount (%)", value: businessDiscount, setter: setBusinessDiscount, checked: applyBusinessDiscount, toggle: setApplyBusinessDiscount },
            ].map(item => <div key={item.label} className="grid grid-cols-[1fr_100px] items-center gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={item.checked} onChange={e => item.toggle(e.target.checked)} /><span>{item.label}</span></label><input type="number" min="0" max="100" step="0.5" value={item.value} onChange={e => item.setter(clampPct(Number(e.target.value)))} className="w-full rounded-xl border border-[#e8ded7] px-3 py-2.5 text-right" /></div>)}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3"><label className="text-sm">Shipping per order (₹)<input type="number" min="0" step="1" value={shipping} onChange={e => setShipping(e.target.value)} className="mt-2 w-full rounded-xl border border-[#e8ded7] px-3 py-3" /></label><label className="text-sm">Business Programme reward (%)<input type="number" min="0" max="100" step="1" value={rewardRate} onChange={e => setRewardRate(clampPct(Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-[#e8ded7] px-3 py-3" /></label></div>
          <p className="mt-4 text-xs leading-5 text-[#8a7e7a]">GST rates are fixed in this calculator: shampoo 5%, all other products 18%. Reward cost is calculated on the final customer payment, after discounts.</p>
        </section>
        <section className="space-y-5">
          <div className="rounded-2xl bg-[#351724] p-6 text-white"><p className="text-sm text-white/70">Estimated net profit per unit</p><p className="mt-2 text-4xl font-semibold">{money(calc?.profit || 0)}</p><p className="mt-2 text-sm text-white/70">Profit margin on sales excluding GST: {(calc?.margin || 0).toFixed(1)}%</p></div>
          <div className="rounded-2xl border border-[#e8ded7] bg-white p-5"><h3 className="font-display text-lg text-[#351724]">Discounted scenario breakdown</h3><div className="mt-4 space-y-3 text-sm">{[[ "Website price (GST inclusive)", calc?.price || 0 ],[ "Applied customer discount", -(calc?.discountAmount || 0) ],[ "Customer pays", calc?.finalInclusive || 0 ],[ "Sales value excluding GST", calc?.salesNet || 0 ],[ "Purchase cost", -(calc?.cogs || 0) ],[ "Shipping", -(calc?.shippingCost || 0) ],[ "Business Programme reward cost", -(calc?.rewardCost || 0) ]].map(([label, amount]) => <div key={String(label)} className="flex items-center justify-between gap-4 border-b border-[#f0e9e4] pb-2"><span className="text-[#6d6260]">{String(label)}</span><span className="font-medium">{money(Number(amount))}</span></div>)}</div></div>
          <div className="rounded-2xl border border-[#e8ded7] bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-lg text-[#351724]">Maximum-discount scenario</h3><p className="mt-1 text-xs text-[#6d6260]">Applies all four entered discounts sequentially, regardless of the actual-scenario checkboxes.</p></div><span className="rounded-full bg-[#f7f3ee] px-3 py-1 text-xs">Stress test</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f7f3ee] p-4"><p className="text-xs text-[#6d6260]">Customer pays</p><p className="mt-1 text-lg font-semibold">{money(calc?.maxInclusive || 0)}</p></div><div className="rounded-xl bg-[#f7f3ee] p-4"><p className="text-xs text-[#6d6260]">Net profit</p><p className="mt-1 text-lg font-semibold">{money(calc?.maxProfit || 0)}</p><p className="mt-1 text-xs text-[#6d6260]">Margin {(calc?.maxMargin || 0).toFixed(1)}%</p></div></div></div>
        </section>
      </div> : <div className="space-y-6">
        <section className="rounded-2xl border border-[#e8ded7] bg-white p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-display text-xl text-[#351724]">Purchase cost master</h2><p className="mt-1 text-sm text-[#6d6260]">Enter one GST-exclusive purchase cost per product. Values are saved for future order calculations.</p></div><button disabled={busy} onClick={saveCosts} className="rounded-full bg-[#351724] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save all purchase costs"}</button></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-[#e8ded7] text-xs uppercase text-[#6d6260]"><th className="p-3">Product</th><th className="p-3">Website price</th><th className="p-3">Purchase cost excl. GST</th></tr></thead><tbody>{data.products.map(p => <tr key={p.id} className="border-b border-[#f0e9e4]"><td className="p-3"><p className="font-medium text-[#351724]">{p.name}</p><p className="text-xs text-[#8a7e7a]">{p.sku}</p></td><td className="p-3">{money(p.price_inr)}</td><td className="p-3"><input type="number" min="0" step="0.01" value={costInputs[p.id] ?? "0"} onChange={e => setCostInputs(prev => ({ ...prev, [p.id]: e.target.value }))} className="w-44 rounded-lg border border-[#e8ded7] px-3 py-2.5" /></td></tr>)}</tbody></table></div>
        </section>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[[ "Delivered orders", orderSummary.delivered.count ],[ "Other fulfilled orders", orderSummary.other.count ],[ "Total shipping cost", orderSummary.total.shipping ],[ "Total net profit", orderSummary.total.profit ]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-[#e8ded7] bg-white p-5"><p className="text-xs text-[#6d6260]">{String(label)}</p><p className="mt-2 text-2xl font-semibold text-[#351724]">{typeof value === "number" && String(label).includes("orders") ? value : money(Number(value))}</p></div>)}</section>
        <section className="grid gap-4 md:grid-cols-2">
          {[[ "Delivered", orderSummary.delivered ],[ "Other fulfilled (shipped)", orderSummary.other ]].map(([label, summary]) => <div key={String(label)} className="rounded-2xl border border-[#e8ded7] bg-white p-5"><h3 className="font-display text-lg text-[#351724]">{String(label)}</h3><div className="mt-4 space-y-2 text-sm">{[[ "Orders", (summary as typeof orderSummary.total).count ],[ "Sales excluding GST", (summary as typeof orderSummary.total).sales ],[ "Purchase costs", (summary as typeof orderSummary.total).cogs ],[ "Shipping", (summary as typeof orderSummary.total).shipping ],[ "27% coin reward cost", (summary as typeof orderSummary.total).rewards ],[ "Net profit", (summary as typeof orderSummary.total).profit ]].map(([k,v]) => <div key={String(k)} className="flex justify-between gap-3 border-b border-[#f0e9e4] pb-2"><span className="text-[#6d6260]">{String(k)}</span><span className="font-medium">{k === "Orders" ? v : money(Number(v))}</span></div>)}</div></div>)}
        </section>
        <section className="rounded-2xl border border-[#e8ded7] bg-white p-5"><h3 className="font-display text-lg text-[#351724]">Order-wise profit</h3><p className="mb-4 mt-1 text-xs text-[#6d6260]">Delivered and shipped orders are counted once each. Cancelled and refunded orders are excluded.</p><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-[#e8ded7] text-xs uppercase text-[#6d6260]"><th className="p-3">Order</th><th className="p-3">Status group</th><th className="p-3">Sales excl. GST</th><th className="p-3">Purchase cost</th><th className="p-3">Shipping</th><th className="p-3">Net profit</th></tr></thead><tbody>{orderSummary.rows.map(r => <tr key={r.order.id} className="border-b border-[#f0e9e4]"><td className="p-3"><p className="font-medium">#{r.order.order_number}</p><p className="text-xs text-[#8a7e7a]">{new Date(r.order.created_at).toLocaleDateString("en-IN")}</p></td><td className="p-3">{r.group}</td><td className="p-3">{money(r.salesNet)}</td><td className="p-3">{money(r.cogs)}</td><td className="p-3">{money(r.ship)}</td><td className={`p-3 font-semibold ${r.netProfit < 0 ? "text-red-700" : "text-green-800"}`}>{money(r.netProfit)}</td></tr>)}{!orderSummary.rows.length && <tr><td colSpan={6} className="p-8 text-center text-[#6d6260]">No shipped or delivered orders found yet.</td></tr>}</tbody></table></div></section>
        <section className="rounded-2xl border border-[#e8ded7] bg-white p-5"><h3 className="font-display text-lg text-[#351724]">Change section password</h3><p className="mt-1 text-sm text-[#6d6260]">Use at least 10 characters. Forgot password sends a one-time link to the registered admin email.</p><ChangePassword onChange={async (currentPassword,newPassword) => { const changed = await submitAccess("change",{currentPassword,newPassword}); if (changed) setUnlocked(false); }} busy={busy} /></section>
      </div> : tab === "pricing" ? <PricingManagementSection onProductSaved={loadData} /> : <div />}
      {tab !== "pricing" && <p className="mt-8 text-xs leading-5 text-[#8a7e7a]">Profit estimates exclude payment gateway fees, packaging and other extra costs as requested. Product costs must be entered before actual profit figures are considered complete.</p>}
    </div>
  </div>;
}

function ChangePassword({ onChange, busy }: { onChange: (currentPassword: string, newPassword: string) => void; busy: boolean }) {
  const [currentPassword,setCurrentPassword] = useState("");
  const [newPassword,setNewPassword] = useState("");
  const [confirm,setConfirm] = useState("");
  const [localError,setLocalError] = useState("");
  return <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={e => { e.preventDefault(); setLocalError(""); if (newPassword.length < 10) return setLocalError("New password must be at least 10 characters."); if (newPassword !== confirm) return setLocalError("Passwords do not match."); onChange(currentPassword,newPassword); }}>
    <input type="password" autoComplete="current-password" required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Current password" className="rounded-xl border border-[#e8ded7] px-3 py-3 text-sm" />
    <input type="password" autoComplete="new-password" required minLength={10} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password (10+ chars)" className="rounded-xl border border-[#e8ded7] px-3 py-3 text-sm" />
    <input type="password" autoComplete="new-password" required minLength={10} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password" className="rounded-xl border border-[#e8ded7] px-3 py-3 text-sm" />
    {localError && <p className="text-sm text-red-600 md:col-span-3">{localError}</p>}
    <button disabled={busy} className="rounded-full bg-[#351724] px-5 py-3 text-sm font-semibold text-white md:col-span-3 disabled:opacity-50">{busy ? "Saving…" : "Change password"}</button>
  </form>;
}


type PricingProduct = { id: string; slug: string; name: string; sku: string; price_inr: number; compare_at_price_inr: number | null; status: string };
type PricingSettings = { discounts: Record<string, { enabled: boolean; type: "percent" | "fixed"; value: number; startsAt?: string | null; endsAt?: string | null }>; updatedAt?: string | null };

function PricingManagementSection({ onProductSaved }: { onProductSaved: () => Promise<void> }) {
  const [products, setProducts] = useState<PricingProduct[]>([]);
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setError("");
    try {
      const res = await fetch("/api/admin/pricing", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load pricing settings.");
      setProducts(json.products ?? []);
      setSettings(json.settings ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load pricing settings.");
    }
  }
  useEffect(() => { void load(); }, []);

  async function saveProduct(product: PricingProduct, name: string, price: number, compareAt: number | null) {
    setBusy(true); setError(""); setNotice("");
    try {
      const res = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id, name, price_inr: price, compare_at_price_inr: compareAt }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save product price.");
      setProducts(current => current.map(p => p.id === product.id ? { ...p, name, price_inr: price, compare_at_price_inr: compareAt } : p));
      setNotice("Product name, website price and MRP saved.");
      await onProductSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save product price."); }
    finally { setBusy(false); }
  }
  async function publish(next: PricingSettings) {
    setBusy(true); setError(""); setNotice("");
    try {
      const res = await fetch("/api/admin/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: next }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not publish discount rules.");
      setSettings(json.settings);
      setNotice("Discount settings published successfully.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not publish discount rules."); }
    finally { setBusy(false); }
  }

  const labels: Record<string,string> = { firstOrder:"First-time customer", bundle:"Bundle", prepaid:"Prepaid", businessProgramme:"Business Programme", festival:"Festival Discount", special:"Special Discount" };
  return <div className="space-y-5">
    <section className="rounded-2xl border border-[#e8ded7] bg-white p-5 md:p-6">
      <div className="mb-4"><h2 className="font-display text-2xl text-[#351724]">Live product prices</h2><p className="mt-1 text-sm text-[#6d6260]">Edit product name, website price and MRP here. These are the live catalog values.</p></div>
      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="mb-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {products.length ? <div className="space-y-3">{products.map(p => <PDPPPriceEditor key={p.id} product={p} busy={busy} onSave={saveProduct} />)}</div> : <p className="text-sm text-[#6d6260]">Loading products or no products found.</p>}
    </section>
    <section className="rounded-2xl border border-[#e8ded7] bg-white p-5 md:p-6">
      <h2 className="font-display text-2xl text-[#351724]">Discount rules</h2><p className="mb-4 mt-1 text-sm text-[#6d6260]">Festival and Special discounts remain inactive until enabled. Changes are not live until published.</p>
      {!settings ? <p className="text-sm text-[#6d6260]">Loading discount settings…</p> : <PDPPDiscountEditor settings={settings} busy={busy} labels={labels} onPublish={publish} />}
    </section>
  </div>;
}

function PDPPPriceEditor({ product, busy, onSave }: { product: PricingProduct; busy: boolean; onSave: (p: PricingProduct, name: string, price: number, compareAt: number | null) => void }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price_inr));
  const [mrp, setMrp] = useState(String(product.compare_at_price_inr ?? ""));
  useEffect(() => { setName(product.name); setPrice(String(product.price_inr)); setMrp(String(product.compare_at_price_inr ?? "")); }, [product.name, product.price_inr, product.compare_at_price_inr]);
  return <div className="grid gap-3 rounded-xl border border-[#e8ded7] p-3 md:grid-cols-[minmax(220px,1fr)_120px_120px_auto] md:items-center">
    <div><label className="block text-xs">Product name<input type="text" maxLength={120} value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e8ded7] p-2 text-sm font-medium" /></label><div className="mt-1 text-xs text-[#6d6260]">{product.sku} · {product.slug}</div></div>
    <label className="text-xs">Website price ₹<input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e8ded7] p-2 text-sm" /></label>
    <label className="text-xs">MRP ₹<input type="number" min="0" value={mrp} onChange={e => setMrp(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e8ded7] p-2 text-sm" /></label>
    <button disabled={busy || !name.trim() || !Number.isInteger(Number(price)) || Number(price) <= 0 || (mrp.trim() !== "" && (!Number.isInteger(Number(mrp)) || Number(mrp) < 0))} onClick={() => onSave(product, name.trim(), Number(price), mrp.trim() === "" ? null : Number(mrp))} className="rounded-full border border-[#e8ded7] px-4 py-2 text-xs font-semibold disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button>
  </div>;
}

function PDPPDiscountEditor({ settings, busy, labels, onPublish }: { settings: PricingSettings; busy: boolean; labels: Record<string,string>; onPublish: (s: PricingSettings) => void }) {
  const [draft, setDraft] = useState<PricingSettings>(settings);
  useEffect(() => { setDraft(settings); }, [settings]);
  function change(key: string, field: "enabled" | "type" | "value", value: boolean | string | number) {
    setDraft(current => ({ ...current, discounts: { ...current.discounts, [key]: { ...current.discounts[key], [field]: value } } }));
  }
  return <div>
    <div className="space-y-3">{Object.entries(labels).map(([key,label]) => { const d = draft.discounts[key]; if (!d) return null; return <div key={key} className="grid gap-3 rounded-xl border border-[#e8ded7] p-4 md:grid-cols-[1fr_auto_130px_130px] md:items-center"><label className="text-sm font-medium">{label}</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.enabled} onChange={e=>change(key,"enabled",e.target.checked)} />Active</label><select value={d.type} onChange={e=>change(key,"type",e.target.value)} className="rounded-lg border border-[#e8ded7] p-2 text-sm"><option value="percent">Percentage %</option><option value="fixed">Fixed ₹</option></select><input type="number" min="0" max={d.type === "percent" ? 100 : undefined} value={d.value} onChange={e=>change(key,"value",Number(e.target.value))} className="rounded-lg border border-[#e8ded7] p-2 text-sm" /></div>})}</div>
    <button disabled={busy} onClick={()=>onPublish(draft)} className="mt-5 rounded-full bg-[#351724] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Publish discount rules"}</button>
  </div>;
}
