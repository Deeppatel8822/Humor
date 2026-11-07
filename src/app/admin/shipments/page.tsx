"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string; order_number: string; created_at: string; status: string; payment_status: string;
  total_inr: number; address?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string; phone?: string } | null;
  customer?: { full_name?: string; phone?: string; email?: string } | null;
  order_items?: { quantity: number; product?: { name?: string; sku?: string } | null }[];
};
type Pack = { weight: string; length: string; width: string; height: string };
export default function AdminShipmentsPage() {
  const [orders,setOrders]=useState<Order[]>([]);
  const [packs,setPacks]=useState<Record<string,Pack>>({});
  const [busy,setBusy]=useState<string|null>(null);
  const [message,setMessage]=useState<Record<string,string>>({});
  const [error,setError]=useState("");
  async function load(){
    setError("");
    try {
      const r=await fetch("/api/admin/orders",{cache:"no-store"});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Could not load orders.");
      setOrders(d.orders||[]);
    } catch(e){setError(e instanceof Error?e.message:"Could not load orders.");}
  }
  useEffect(()=>{void load();},[]);
  function update(id:string,key:keyof Pack,value:string){setPacks(p=>({...p,[id]:{weight:p[id]?.weight||"",length:p[id]?.length||"",width:p[id]?.width||"",height:p[id]?.height||"",[key]:value}}));}
  async function createShipment(order:Order){
    const p=packs[order.id];
    if(!p||![p.weight,p.length,p.width,p.height].every(v=>Number(v)>0)){setMessage(m=>({...m,[order.id]:"Enter verified packed weight and all dimensions."}));return;}
    setBusy(order.id);setMessage(m=>({...m,[order.id]:""}));
    try{
      const r=await fetch("/api/admin/shipmozo/shipments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:order.id,weightGrams:Number(p.weight),lengthCm:Number(p.length),widthCm:Number(p.width),heightCm:Number(p.height)})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||"Could not create shipment.");
      setMessage(m=>({...m,[order.id]:d.note||"Shipmozo shipment created."}));
    }catch(e){setMessage(m=>({...m,[order.id]:e instanceof Error?e.message:"Could not create shipment."}));}
    finally{setBusy(null);}
  }
  return <main className="min-h-screen bg-[var(--milk-sage)] px-5 py-10 md:px-8"><div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Luxury · Logistics</p><h1 className="mt-2 font-display text-3xl text-[var(--deep-wine)]">Shipmozo Order Dispatch</h1><p className="mt-2 text-sm text-[var(--muted)]">Review each packed parcel, then push the order and request automatic courier assignment.</p></div><a href="/admin" className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm">Back to Admin</a></div>
    {error&&<p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Important: Enter the final packed parcel dimensions, not just the sum of individual product dimensions. The order will be pushed to Shipmozo and auto-assignment will run. If auto-assignment is not configured in Shipmozo, assign the courier manually in its panel.</div>
    {orders.map(o=><section key={o.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-lg text-[var(--deep-wine)]">Order #{o.order_number}</h2><p className="text-sm text-[var(--muted)]">{o.customer?.full_name||"Customer"} · {o.address?.pincode||"No pincode"} · {o.payment_status||"payment status unknown"}</p><p className="mt-1 text-xs text-[var(--muted)]">{(o.order_items||[]).map(i=>(i.product?.name||"Product")+" × "+i.quantity).join(" · ")}</p></div><div className="text-right"><p className="font-semibold">₹{o.total_inr}</p><p className="text-xs text-[var(--muted)]">{o.status}</p></div></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{(["weight","length","width","height"] as const).map(k=><label key={k} className="text-xs text-[var(--muted)]">{k==="weight"?"Weight (g)":k[0].toUpperCase()+k.slice(1)+" (cm)"}<input type="number" min="0.01" step="0.01" value={packs[o.id]?.[k]||""} onChange={e=>update(o.id,k,e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)]"/></label>)}</div>
      <div className="flex flex-wrap items-center gap-3"><button disabled={busy===o.id} onClick={()=>createShipment(o)} className="rounded-full bg-[var(--deep-wine)] px-5 py-2.5 text-sm text-white disabled:opacity-50">{busy===o.id?"Sending to Shipmozo…":"Push order & auto-assign courier"}</button>{message[o.id]&&<p className="text-sm text-[var(--muted)]">{message[o.id]}</p>}</div>
    </section>)}
    {!orders.length&&<p className="rounded-2xl border border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">No orders found.</p>}
  </div></main>;
}
