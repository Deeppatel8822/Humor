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
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      subtotal_inr,
      discount_inr,
      shipping_inr,
      total_inr,
      payment_status,
      razorpay_order_id,
      razorpay_payment_id,
      tracking_number,
      created_at,
      updated_at,
      customer:customers(full_name,email,phone),
      address:addresses(line1,line2,city,state,pincode,country,phone),
      order_items(
        quantity,
        unit_price_inr,
        product:products(name,sku)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin orders load error:", error);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim().toLowerCase();
    const trackingNumber = body.tracking_number == null ? null : String(body.tracking_number).trim() || null;
    const allowedStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

    if (!id || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin()
      .from("orders")
      .update({
        status,
        tracking_number: trackingNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, order_number, status, tracking_number, updated_at")
      .single();

    if (error) {
      console.error("Admin order update error:", error);
      return NextResponse.json({ error: "Could not update order." }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
