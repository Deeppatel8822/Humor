import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

const COOKIE_NAME = "humor_admin";

function validAdmin(value: string | undefined) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!email || !value || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  return value === expected;
}

async function authorized() {
  const cookieStore = await cookies();
  return validAdmin(cookieStore.get(COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("id, catalog_id, name, sku, price_inr, stock_quantity, status, category")
    .order("name");
  if (error) return NextResponse.json({ error: "Could not load products." }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const hasStock = body.stock_quantity !== undefined;
    const hasPrice = body.price_inr !== undefined;
    const stock = Number(body.stock_quantity);
    const price = Number(body.price_inr);

    if (!id || (!hasStock && !hasPrice)) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    if (hasStock && (!Number.isInteger(stock) || stock < 0)) {
      return NextResponse.json({ error: "Invalid stock quantity." }, { status: 400 });
    }
    if (hasPrice && (!Number.isInteger(price) || price <= 0)) {
      return NextResponse.json({ error: "Invalid product price." }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (hasStock) updates.stock_quantity = stock;
    if (hasPrice) updates.price_inr = price;

    const { data, error } = await supabaseAdmin()
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("id, name, price_inr, stock_quantity")
      .single();

    if (error) {
      console.error("Admin product update error:", error);
      return NextResponse.json({ error: "Could not update product." }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
