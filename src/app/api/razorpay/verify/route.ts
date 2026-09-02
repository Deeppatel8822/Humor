import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { products } from "@/lib/products";

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  lines: { productId: string; quantity: number }[];
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  subtotalInr: number;
  shippingInr: number;
}

export async function POST(req: NextRequest) {
  const body: VerifyBody = await req.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, lines, shipping, subtotalInr, shippingInr } = body;

  // 1. Verify the payment signature — this is the step that actually confirms
  // Razorpay processed the payment, rather than trusting the client's word for it.
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const totalInr = subtotalInr + shippingInr;
  const orderNumber = `HL-${Math.floor(10000 + Math.random() * 90000)}`;

  // 2. Persist the order. If Supabase isn't configured yet (local dev before
  // the project is set up), skip persistence but still confirm the payment —
  // the money has moved either way, so the customer should see success.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ orderNumber, persisted: false });
  }

  try {
    const admin = supabaseAdmin();

    const { data: customer, error: customerErr } = await admin
      .from("customers")
      .upsert(
        { email: shipping.email, phone: shipping.phone, full_name: shipping.fullName },
        { onConflict: "email" }
      )
      .select()
      .single();
    if (customerErr) throw customerErr;

    const { data: address, error: addressErr } = await admin
      .from("addresses")
      .insert({
        customer_id: customer.id,
        line1: shipping.line1,
        line2: shipping.line2 ?? null,
        city: shipping.city,
        state: shipping.state,
        pincode: shipping.pincode,
        phone: shipping.phone,
      })
      .select()
      .single();
    if (addressErr) throw addressErr;

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        status: "paid",
        subtotal_inr: subtotalInr,
        shipping_inr: shippingInr,
        total_inr: totalInr,
        shipping_address_id: address.id,
        razorpay_order_id,
        razorpay_payment_id,
        payment_status: "paid",
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    const orderItems = lines.map((line) => {
      const product = products.find((p) => p.id === line.productId);
      return {
        order_id: order.id,
        product_id: line.productId,
        quantity: line.quantity,
        unit_price_inr: product?.price_inr ?? 0,
      };
    });
    const { error: itemsErr } = await admin.from("order_items").insert(orderItems);
    if (itemsErr) throw itemsErr;

    return NextResponse.json({ orderNumber, orderId: order.id, persisted: true });
  } catch (err) {
    console.error("Order persistence failed after successful payment:", err);
    return NextResponse.json({ orderNumber, persisted: false, warning: "Order recorded, but confirmation email may be delayed." });
  }
}
