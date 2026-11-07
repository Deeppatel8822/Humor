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
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function authorized() {
  const store = await cookies();
  return validAdmin(store.get(COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("id,name,sku,weight_grams,length_cm,width_cm,height_cm,status")
    .order("name");
  if (error) {
    console.error("Shipping product load failed:", error);
    return NextResponse.json({ error: "Could not load product package details. Apply the Shipmozo database migration first." }, { status: 500 });
  }
  return NextResponse.json({ products: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "Product ID is required." }, { status: 400 });

    const fields = ["weight_grams", "length_cm", "width_cm", "height_cm"] as const;
    const updates: Record<string, number> = {};
    for (const field of fields) {
      const value = Number(body[field]);
      if (!Number.isFinite(value) || value <= 0 || value > 100000) {
        return NextResponse.json({ error: "Enter a positive value for weight and all three dimensions." }, { status: 400 });
      }
      updates[field] = value;
    }

    const { data, error } = await supabaseAdmin()
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id,name,sku,weight_grams,length_cm,width_cm,height_cm")
      .single();

    if (error) {
      console.error("Shipping product update failed:", error);
      return NextResponse.json({ error: "Could not save package details." }, { status: 500 });
    }
    return NextResponse.json({ success: true, product: data });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
