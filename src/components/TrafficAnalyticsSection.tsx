"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type TrafficEvent = {
  id: string; session_id: string; page_path: string; page_title: string | null;
  referrer: string | null; source: string | null; medium: string | null;
  campaign: string | null; device_type: string | null; product_slug: string | null; created_at: string;
};
type CartEvent = { id: string; session_id: string; event_type: string; product_slug: string | null; product_name: string | null; page_path: string | null; created_at: string; };
type ProductStat = { slug: string; name: string; views: number; carts: number; checkouts: number; };

const cardClass = "rounded-2xl border border-[var(--line)] bg-white p-5";
const pretty = (value: string) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function TrafficAnalyticsSection() {
  const [range, setRange] = useState("7d");
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [cartEvents, setCartEvents] = useState<CartEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/traffic?range=${range}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load traffic analytics.");
      setEvents(data.events || []); setCartEvents(data.cartEvents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load traffic analytics.");
    } finally { setLoading(false); }
  }, [range]);

  useEffect(() => { void load(); }, [load]);

  const uniqueVisitors = useMemo(() => new Set(events.map((e) => e.session_id)).size, [events]);
  const pageViews = events.length;
  const pages = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => map.set(e.page_path, (map.get(e.page_path) || 0) + 1));
    return [...map.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 10);
  }, [events]);
  const products = useMemo(() => {
    const map = new Map<string, ProductStat>();
    const ensure = (slug: string, name?: string) => {
      if (!map.has(slug)) map.set(slug, { slug, name: name || pretty(slug), views: 0, carts: 0, checkouts: 0 });
      else if (name && map.get(slug)!.name === pretty(slug)) map.get(slug)!.name = name;
      return map.get(slug)!;
    };
    events.forEach((e) => { if (e.product_slug) ensure(e.product_slug).views += 1; });
    cartEvents.forEach((e) => {
      if (!e.product_slug) return;
      const item = ensure(e.product_slug, e.product_name || undefined);
      if (e.event_type === "add_to_cart") item.carts += 1;
      if (e.event_type === "checkout_started") item.checkouts += 1;
    });
    return [...map.values()].sort((a, b) => (b.views + b.carts * 2 + b.checkouts * 3) - (a.views + a.carts * 2 + a.checkouts * 3)).slice(0, 10);
  }, [events, cartEvents]);
  const sources = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => { const key = e.source || "direct"; map.set(key, (map.get(key) || 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [events]);
  const devices = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => { const key = e.device_type || "unknown"; map.set(key, (map.get(key) || 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [events]);
  const funnel = useMemo(() => ({
    views: new Set(events.filter((e) => e.product_slug).map((e) => e.session_id)).size,
    carts: new Set(cartEvents.filter((e) => e.event_type === "add_to_cart").map((e) => e.session_id)).size,
    checkout: new Set(cartEvents.filter((e) => e.event_type === "checkout_started").map((e) => e.session_id)).size,
    purchases: new Set(cartEvents.filter((e) => e.event_type === "purchase_completed").map((e) => e.session_id)).size,
  }), [events, cartEvents]);

  function exportCsv() {
    const rows = [["Date", "Session", "Page", "Title", "Source", "Medium", "Campaign", "Device", "Product slug"],
      ...events.map((e) => [e.created_at, e.session_id, e.page_path, e.page_title || "", e.source || "", e.medium || "", e.campaign || "", e.device_type || "", e.product_slug || ""])];
    const csv = rows.map((row) => row.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `humor-traffic-${range}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  const maxSource = Math.max(1, ...sources.map((s) => s.count));
  return <section className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div><h2 className="font-display text-2xl text-[var(--deep-wine)]">Website Traffic</h2><p className="text-sm text-[var(--muted)] mt-1">Visitors, page views, product interest and shopping journey.</p></div>
      <div className="flex flex-wrap gap-2">
        <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm"><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select>
        <button onClick={() => void load()} className="rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm">Refresh</button>
        <button onClick={exportCsv} disabled={!events.length} className="rounded-full bg-[var(--deep-wine)] text-white px-4 py-2.5 text-sm disabled:opacity-40">Export CSV</button>
      </div>
    </div>
    {error && <div className="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-600">{error}</div>}
    {loading ? <div className={cardClass + " text-sm text-[var(--muted)]"}>Loading traffic data…</div> : <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={cardClass}><p className="text-xs text-[var(--muted)]">Unique visitors</p><p className="text-3xl font-semibold text-[var(--deep-wine)] mt-2">{uniqueVisitors.toLocaleString("en-IN")}</p></div>
        <div className={cardClass}><p className="text-xs text-[var(--muted)]">Page views</p><p className="text-3xl font-semibold text-[var(--deep-wine)] mt-2">{pageViews.toLocaleString("en-IN")}</p></div>
        <div className={cardClass}><p className="text-xs text-[var(--muted)]">Add to carts</p><p className="text-3xl font-semibold text-[var(--deep-wine)] mt-2">{cartEvents.filter((e) => e.event_type === "add_to_cart").length.toLocaleString("en-IN")}</p></div>
        <div className={cardClass}><p className="text-xs text-[var(--muted)]">Checkout starts</p><p className="text-3xl font-semibold text-[var(--deep-wine)] mt-2">{cartEvents.filter((e) => e.event_type === "checkout_started").length.toLocaleString("en-IN")}</p></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={cardClass}><h3 className="font-semibold text-[var(--deep-wine)] mb-4">Top products</h3>
          {products.length ? <div className="space-y-3">{products.map((p) => <div key={p.slug} className="border-b border-[var(--line)] pb-3 last:border-0"><div className="font-medium text-sm">{p.name}</div><div className="grid grid-cols-3 gap-2 mt-2 text-xs text-[var(--muted)]"><span>Views <b className="text-[var(--deep-wine)]">{p.views}</b></span><span>Added <b className="text-[var(--deep-wine)]">{p.carts}</b></span><span>Checkout <b className="text-[var(--deep-wine)]">{p.checkouts}</b></span></div></div>)}</div> : <p className="text-sm text-[var(--muted)]">Product page visits will appear here as tracking starts.</p>}
        </div>
        <div className={cardClass}><h3 className="font-semibold text-[var(--deep-wine)] mb-4">Top pages</h3>{pages.length ? <div className="space-y-3">{pages.map((p) => <div key={p.path}><div className="flex justify-between gap-3 text-sm"><span className="truncate">{p.path}</span><b>{p.views}</b></div><div className="h-2 rounded-full bg-[#f1e9ed] mt-1 overflow-hidden"><div className="h-full rounded-full bg-[var(--deep-wine)]" style={{ width: `${Math.max(3, p.views / pageViews * 100)}%` }} /></div></div>)}</div> : <p className="text-sm text-[var(--muted)]">No page views recorded yet.</p>}</div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className={cardClass}><h3 className="font-semibold text-[var(--deep-wine)] mb-4">Traffic sources</h3>{sources.length ? <div className="space-y-3">{sources.map((s) => <div key={s.name}><div className="flex justify-between text-sm"><span>{pretty(s.name)}</span><b>{s.count}</b></div><div className="h-2 rounded-full bg-[#f1e9ed] mt-1 overflow-hidden"><div className="h-full rounded-full bg-[var(--warm-gold)]" style={{ width: `${s.count / maxSource * 100}%` }} /></div></div>)}</div> : <p className="text-sm text-[var(--muted)]">No source data yet.</p>}</div>
        <div className={cardClass}><h3 className="font-semibold text-[var(--deep-wine)] mb-4">Device breakdown</h3><div className="grid grid-cols-3 gap-2">{["mobile", "desktop", "tablet"].map((name) => <div key={name} className="rounded-xl bg-[var(--milk-sage)] p-3"><p className="text-xs text-[var(--muted)] capitalize">{name}</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-1">{devices.find((d) => d.name === name)?.count || 0}</p></div>)}</div></div>
      </div>
      <div className={cardClass}><h3 className="font-semibold text-[var(--deep-wine)] mb-4">Shopping funnel · unique sessions</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[{label:"Product views",value:funnel.views},{label:"Added to cart",value:funnel.carts},{label:"Checkout started",value:funnel.checkout},{label:"Purchase completed",value:funnel.purchases}].map((step) => <div key={step.label} className="rounded-xl bg-[var(--milk-sage)] p-4"><p className="text-xs text-[var(--muted)]">{step.label}</p><p className="text-2xl font-semibold text-[var(--deep-wine)] mt-2">{step.value}</p></div>)}</div></div>
      <div className={cardClass}><div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-[var(--deep-wine)]">Recent page activity</h3><span className="text-xs text-[var(--muted)]">Latest 12 events</span></div>{events.slice(0,12).length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs min-w-[620px]"><thead className="text-[var(--muted)] border-b border-[var(--line)]"><tr><th className="py-2 pr-3">Time</th><th className="py-2 pr-3">Page</th><th className="py-2 pr-3">Source</th><th className="py-2 pr-3">Device</th></tr></thead><tbody>{events.slice(0,12).map((e) => <tr key={e.id} className="border-b border-[var(--line)] last:border-0"><td className="py-3 pr-3 whitespace-nowrap">{new Date(e.created_at).toLocaleString("en-IN")}</td><td className="py-3 pr-3 max-w-[260px] truncate">{e.page_path}</td><td className="py-3 pr-3">{e.source || "direct"}</td><td className="py-3 pr-3 capitalize">{e.device_type || "unknown"}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[var(--muted)]">Traffic data will appear after visitors browse the website. Historical visits cannot be backfilled.</p>}</div>
      <p className="text-xs text-[var(--muted)]">Visitor counts use an anonymous browser session ID. Page tracking starts after this feature is deployed; earlier website visits are not available retroactively. Existing cart events are included where recorded.</p>
    </>}
  </section>;
}
