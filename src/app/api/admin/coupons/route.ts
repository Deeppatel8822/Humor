import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

async function authorized() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const value = (await cookies()).get("humor_admin")?.value;
  if (!email || !value || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  return value === expected;
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin().from("coupons").select("id,code,discount_type,discount_value,min_order_inr,is_active,expires_at").order("code");
  if (error) return NextResponse.json({ error: "Could not load coupons." }, { status: 500 });
  return NextResponse.json({ coupons: data ?? [] });
}
