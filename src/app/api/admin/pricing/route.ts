import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { PROFIT_COOKIE, validProfitCookie } from "@/lib/profitAccess";

export const dynamic = "force-dynamic";
async function authorized() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const value = (await cookies()).get("humor_admin")?.value;
  if (!email || !value || !secret) return false;
  return value === crypto.createHmac("sha256", secret).update(email).digest("hex");
}
const defaults = {
  discounts: {
    firstOrder: { enabled: true, type: "percent", value: 10 },
    bundle: { enabled: true, type: "percent", value: 8 },
    prepaid: { enabled: true, type: "percent", value: 3 },
    businessProgramme: { enabled: true, type: "percent", value: 10 },
    festival: { enabled: false, type: "percent", value: 0 },
    special: { enabled: false, type: "percent", value: 0 },
  },
  updatedAt: null as string | null,
};
function validate(input: any) {
  if (!input || typeof input !== "object" || !input.discounts || typeof input.discounts !== "object") return false;
  for (const key of ["firstOrder","bundle","prepaid","businessProgramme","festival","special"]) {
    const d = input.discounts[key];
    if (!d || typeof d.enabled !== "boolean" || !["percent","fixed"].includes(d.type) ||
      !Number.isFinite(Number(d.value)) || Number(d.value) < 0 ||
      (d.type === "percent" && Number(d.value) > 100)) return false;
  }
  return true;
}
export async function GET(request: NextRequest) {
  const isAdmin = await authorized();
  const db = supabaseAdmin();
  const { data, error } = await db.from("store_pricing_settings").select("settings,updated_at").eq("id","active").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load pricing settings." }, { status: 500 });
  if (!isAdmin) {
    const safe = data?.settings ?? defaults;
    return NextResponse.json({ discounts: safe.discounts, updatedAt: data?.updated_at ?? null }, { headers: { "Cache-Control": "no-store" } });
  }
  const { data: products, error: productsError } = await db.from("products").select("id,slug,name,sku,price_inr,compare_at_price_inr,status").order("name");
  if (productsError) return NextResponse.json({ error: "Could not load product prices." }, { status: 500 });
  return NextResponse.json({ settings: data?.settings ?? defaults, updatedAt: data?.updated_at ?? null, products: products ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
export async function PUT(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = supabaseAdmin();
  const { data: access, error: accessError } = await db.from("profit_management_access").select("password_hash").eq("id", "owner").maybeSingle();
  if (accessError || !access?.password_hash || !validProfitCookie(request.cookies.get(PROFIT_COOKIE)?.value, access.password_hash)) {
    return NextResponse.json({ error: "Unlock PDPP before publishing discount settings." }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (!validate(body.settings)) return NextResponse.json({ error: "Invalid discount settings." }, { status: 400 });
    const now = new Date().toISOString();
    const settings = { ...body.settings, updatedAt: now };
    const { error } = await supabaseAdmin().from("store_pricing_settings").upsert({ id: "active", settings, updated_at: now }, { onConflict: "id" });
    if (error) return NextResponse.json({ error: "Could not publish pricing settings." }, { status: 500 });
    return NextResponse.json({ success: true, settings, updatedAt: now });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
