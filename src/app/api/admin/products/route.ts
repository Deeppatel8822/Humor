import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

const COOKIE_NAME = "humor_admin";

function validAdmin(value: string | undefined) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!email || !value) return false;
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
    const { id, stock_quantity } = await request.json();
    const stock = Number(stock_quantity);
    if (!id || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Invalid stock quantity." }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin()
      .from("products")
      .update({ stock_quantity: stock, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, name, stock_quantity")
      .single();
    if (error) return NextResponse.json({ error: "Could not update stock." }, { status: 500 });
    return NextResponse.json({ success: true, product: data });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
