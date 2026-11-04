import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const orderId = String(req.nextUrl.searchParams.get("razorpay_order_id") || "").trim();
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) {
    return NextResponse.json({ error: "Invalid Razorpay order reference." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select("order_number, total_inr, payment_status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (error) {
    console.error("Razorpay order status lookup failed:", error);
    return NextResponse.json({ error: "Could not check order status." }, { status: 503 });
  }
  if (!data || data.payment_status !== "paid") {
    return NextResponse.json({ ready: false }, { status: 202 });
  }
  return NextResponse.json({
    ready: true,
    orderNumber: data.order_number,
    totalInr: Number(data.total_inr),
  });
}
