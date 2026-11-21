import { validAdminSession } from "@/lib/adminAuth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

async function authorized() { return validAdminSession((await cookies()).get("humor_admin")?.value); }

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin().from("coupons").select("id,code,discount_type,discount_value,min_order_inr,is_active,expires_at").order("code");
  if (error) return NextResponse.json({ error: "Could not load coupons." }, { status: 500 });
  return NextResponse.json({ coupons: data ?? [] });
}
