"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Partner = { status: "pending"|"approved"|"rejected"; code?: string; expiresAt?: string; usageCount?: number; usageLimit?: number; walletBalance?: number; totalRewards?: number; totalSales?: number; referredCustomers?: number; };
export default function MarketingPartnerPage() {
  const [sessionToken, setSessionToken] = useState("");
  const [partner, setPartner] = useState<Partner|null>(null);
  const [application, setApplication] = useState<any>(null);
  const [form, setForm] = useState({businessName:"",gstPan:"",address:"",mobile:""});
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");

  async function load() {
    try {
      const {getSupabase}=await import("@/lib/supabase");
      const {data}=await getSupabase().auth.getSession();
      if (!data.session) { setLoading(false); return; }
      setSessionToken(data.session.access_token);
      const res=await fetch("/api/marketing-partner/application",{headers:{Authorization:"Bearer "+data.session.access_token},cache:"no-store"});
      const result=await res.json();
      if(res.ok){setPartner(result.partner);setApplication(result.application);}
    } catch { setError("Could not load your partner status."); }
    finally {setLoading(false);}
  }
  useEffect(()=>{load();},[]);

  async function submit(e:React.FormEvent){
    e.preventDefault(); setSaving(true); setError(""); setMessage("");
    if(photos.length!==3){setError("Please select exactly 3 business photos.");setSaving(false);return;}
    try{
      const res=await fetch("/api/marketing-partner/application",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+sessionToken},body:JSON.stringify({...form,photoNames:photos})});
      const data=await res.json(); if(!res.ok) throw new Error(data.error||"Could not submit application.");
      setApplication(data.application); setPartner({status:"pending"}); setMessage("Application submitted successfully. Our team will verify your details.");
    }catch(err){setError(err instanceof Error?err.message:"Could not submit application.");}
    finally{setSaving(false);}
  }

  if(loading) return <main className="max-w-5xl mx-auto px-5 py-20"><p className="text-sm text-[var(--muted)]">Loading…</p></main>;
  if(!sessionToken) return <main className="max-w-xl mx-auto px-5 py-24 text-center"><h1 className="font-display text-4xl text-[var(--deep-wine)]">Marketing Partner</h1><p className="text-sm text-[var(--muted)] mt-3">Please login to register and manage your partner account.</p><button onClick={()=>window.dispatchEvent(new CustomEvent("humor-open-customer-auth"))} className="mt-7 rounded-full bg-[var(--deep-wine)] text-white px-7 py-3.5 text-sm">Login / Create Account</button></main>;

  if(partner?.status==="approved"){
    return <main className="bg-[var(--milk-sage)] min-h-[70vh] px-5 md:px-8 py-12"><div className="max-w-5xl mx-auto"><div className="flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)]">Marketing Partner</p><h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mt-2">Your Partner Dashboard</h1></div><Link href="/account" className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-xs font-medium">My Account</Link></div><div className="mt-8 grid md:grid-cols-4 gap-4"><div className="rounded-2xl bg-white border border-[var(--line)] p-5"><p className="text-xs text-[var(--muted)]">Wallet balance</p><p className="text-3xl font-semibold text-[var(--deep-wine)] mt-2">₹{Number(partner.walletBalance||0).toLocaleString("en-IN")}</p></div><div className="rounded-2xl bg-white border border-[var(--line)] p-5"><p className="text-xs text-[var(--muted)]">Customers referred</p><p className="text-3xl font-semibold text-[var(--deep-wine)] mt-2">{partner.referredCustomers||0}</p></div><div className="rounded-2xl bg-white border border-[var(--line)] p-5"><p className="text-xs text-[var(--muted)]">Total rewards</p><p className="text-3xl font-semibold text-[var(--deep-wine)] mt-2">₹{Number(partner.totalRewards||0).toLocaleString("en-IN")}</p></div><div className="rounded-2xl bg-white border border-[var(--line)] p-5"><p className="text-xs text-[var(--muted)]">Referral sales</p><p className="text-3xl font-semibold text-[var(--deep-wine)] mt-2">₹{Number(partner.totalSales||0).toLocaleString("en-IN")}</p></div></div><div className="mt-6 rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8"><p className="text-xs text-[var(--muted)]">Your partner code</p><div className="mt-2 flex flex-col sm:flex-row gap-3"><div className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--milk-sage)] px-5 py-4 text-lg font-semibold tracking-widest text-[var(--deep-wine)]">{partner.code}</div><button onClick={()=>navigator.clipboard?.writeText(partner.code||"")} className="rounded-full bg-[var(--deep-wine)] text-white px-6 py-3 text-sm">Copy Code</button></div><p className="mt-3 text-xs text-[var(--muted)]">Valid until {partner.expiresAt ? new Date(partner.expiresAt).toLocaleDateString("en-IN") : "—"} · {Math.max(0,(partner.usageLimit||1000)-(partner.usageCount||0))} uses remaining</p><div className="mt-7 flex flex-col sm:flex-row gap-3"><button onClick={()=>window.dispatchEvent(new CustomEvent("humor-open-customer-auth"))} className="rounded-full border border-[var(--line)] px-6 py-3 text-sm">Account</button><Link href="/shop" className="rounded-full bg-[var(--deep-wine)] text-white px-6 py-3 text-sm text-center">Use reward to shop</Link></div><p className="mt-4 text-xs text-[var(--muted)]">Cash withdrawal is available once your wallet reaches ₹1,000.</p></div></div></main>;
  }

  return <main className="bg-[var(--milk-sage)] min-h-[70vh] px-5 md:px-8 py-12"><div className="max-w-3xl mx-auto"><p className="text-xs uppercase tracking-[0.2em] text-[var(--warm-gold)]">Humor Luxury</p><h1 className="font-display text-3xl md:text-4xl text-[var(--deep-wine)] mt-2">Become a Marketing Partner</h1><p className="text-sm text-[var(--muted)] mt-3 leading-6">Register your business. After verification, you receive a unique partner code that customers can use at checkout. You earn a flat 10% reward on eligible billed product value.</p>{partner?.status==="pending"||application?.status==="pending" ? <div className="mt-8 rounded-3xl bg-white border border-[var(--line)] p-7"><span className="rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold">Under review</span><h2 className="font-display text-2xl text-[var(--deep-wine)] mt-4">Application submitted</h2><p className="text-sm text-[var(--muted)] mt-2">Our team will verify your business details and activate your partner code after approval.</p></div> : <form onSubmit={submit} className="mt-8 rounded-3xl bg-white border border-[var(--line)] p-6 md:p-8 space-y-5"><div><label className="text-xs font-medium">Business name</label><input required value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="Your business name"/></div><div className="grid sm:grid-cols-2 gap-4"><div><label className="text-xs font-medium">GST / PAN</label><input required value={form.gstPan} onChange={e=>setForm({...form,gstPan:e.target.value})} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="GST or PAN number"/></div><div><label className="text-xs font-medium">Mobile number</label><input required value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm" placeholder="+91…"/></div></div><div><label className="text-xs font-medium">Business address</label><textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 text-sm min-h-28" placeholder="Full business address"/></div><div><label className="text-xs font-medium">Business photos (3)</label><input required type="file" accept="image/*" multiple onChange={e=>setPhotos(Array.from(e.target.files||[]).slice(0,3).map(f=>f.name))} className="mt-2 block w-full text-sm"/><p className="mt-2 text-xs text-[var(--muted)]">Select exactly 3 photos. They are recorded with your application for verification.</p></div>{error&&<p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{message&&<p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>}<button disabled={saving} className="w-full rounded-full bg-[var(--deep-wine)] text-white py-3.5 text-sm font-medium disabled:opacity-50">{saving?"Submitting…":"Submit for Verification"}</button></form>}</div></main>;
}
