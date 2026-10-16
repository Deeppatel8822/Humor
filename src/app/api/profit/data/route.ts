import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { PROFIT_COOKIE, validProfitCookie } from "@/lib/profitAccess";

export const dynamic = "force-dynamic";
async function accessOk(request: NextRequest) {
  const { data, error } = await supabaseAdmin().from("profit_management_access").select("password_hash").eq("id", "owner").maybeSingle();
  if (error || !data?.password_hash) return false;
  return validProfitCookie(request.cookies.get(PROFIT_COOKIE)?.value, data.password_hash);
}

export async function GET(request: NextRequest) {
  if (!(await accessOk(request))) return NextResponse.json({ error: "Unlock Profit Management first." }, { status: 401 });
  const db = supabaseAdmin();
  const [productsResult, costsResult, ordersResult] = await Promise.all([
    db.from("products").select("id,slug,name,sku,price_inr,compare_at_price_inr,category,status").order("name"),
    db.from("profit_product_costs").select("product_id,purchase_cost_inr"),
    db.from("orders").select(`
      id,order_number,status,subtotal_inr,discount_inr,shipping_inr,total_inr,payment_status,created_at,
      order_items(product_id,bundle_id,quantity,unit_price_inr,product:products(id,slug,name,sku,category),bundle:bundles(id,name,product_ids))
    `).order("created_at", { ascending: false }),
  ]);
  if (productsResult.error || costsResult.error || ordersResult.error) {
    console.error("Profit data query failed", productsResult.error, costsResult.error, ordersResult.error);
    return NextResponse.json({ error: "Could not load profit data. Check database schema and relationships." }, { status: 500 });
  }
  return NextResponse.json({
    products: productsResult.data ?? [],
    costs: costsResult.data ?? [],
    orders: ordersResult.data ?? [],
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!(await accessOk(request))) return NextResponse.json({ error: "Unlock Profit Management first." }, { status: 401 });
  try {
    const body = await request.json();
    if (!Array.isArray(body.costs)) return NextResponse.json({ error: "Invalid product cost list." }, { status: 400 });
    const rows = body.costs.map((item: { product_id?: unknown; purchase_cost_inr?: unknown }) => ({
      product_id: String(item.product_id || ""),
      purchase_cost_inr: Number(item.purchase_cost_inr),
      updated_at: new Date().toISOString(),
    }));
    if (rows.some((row: { product_id: string; purchase_cost_inr: number }) => !row.product_id || !Number.isFinite(row.purchase_cost_inr) || row.purchase_cost_inr < 0)) {
      return NextResponse.json({ error: "Purchase costs must be valid non-negative amounts." }, { status: 400 });
    }
    if (rows.length) {
      const { error } = await supabaseAdmin().from("profit_product_costs").upsert(rows, { onConflict: "product_id" });
      if (error) return NextResponse.json({ error: "Could not save purchase costs." }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "Purchase costs saved." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
