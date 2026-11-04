import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Razorpay calls this endpoint after a payment is captured.
 * Configure the same secret in Razorpay Webhooks and Vercel as
 * RAZORPAY_WEBHOOK_SECRET. The handler is idempotent because it delegates
 * finalization to /api/razorpay/verify, which uniquely keys orders by
 * razorpay_order_id and repairs missing order_items on retries.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret || !keySecret) {
    console.error("Razorpay webhook is missing RAZORPAY_WEBHOOK_SECRET or RAZORPAY_KEY_SECRET.");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const rawBody = await req.text();
  const suppliedSignature = req.headers.get("x-razorpay-signature") || "";
  if (!/^[a-f0-9]{64}$/i.test(suppliedSignature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  const supplied = Buffer.from(suppliedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  // Other events are acknowledged, but only captured payments create orders.
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = String(payment?.order_id || "");
  const paymentId = String(payment?.id || "");
  if (!orderId || !paymentId || payment?.status !== "captured" || payment?.currency !== "INR") {
    return NextResponse.json({ error: "Captured payment details are incomplete." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: draft, error: draftError } = await admin
    .from("checkout_payment_drafts")
    .select("shipping, lines, subtotal_inr, shipping_inr, vendor_code, coupon_code")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (draftError) {
    console.error("Razorpay webhook draft lookup failed:", draftError);
    return NextResponse.json({ error: "Could not load saved checkout." }, { status: 500 });
  }
  if (!draft) {
    console.error("Razorpay captured payment has no checkout draft:", orderId, paymentId);
    return NextResponse.json({ error: "Saved checkout draft not found." }, { status: 409 });
  }

  // The browser callback's signature can be lost or rejected after the bank
  // has paid. Here Razorpay's signed webhook plus the server-authenticated
  // Razorpay API credentials establish the event. Generate the standard
  // checkout signature server-side and reuse the existing strict finalizer.
  const checkoutSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const verifyUrl = new URL("/api/razorpay/verify", req.url);
  let finalizeResponse: Response;
  try {
    finalizeResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: checkoutSignature,
        lines: draft.lines,
        shipping: draft.shipping,
        subtotalInr: draft.subtotal_inr,
        shippingInr: draft.shipping_inr,
        vendorCode: draft.vendor_code || "",
        couponCode: draft.coupon_code || "",
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Razorpay webhook could not call order finalizer:", error);
    return NextResponse.json({ error: "Order finalization could not be reached." }, { status: 503 });
  }

  if (!finalizeResponse.ok) {
    const detail = await finalizeResponse.text();
    console.error("Razorpay webhook order finalization failed:", orderId, paymentId, finalizeResponse.status, detail);
    return NextResponse.json({ error: "Payment captured; order finalization will be retried." }, { status: 503 });
  }

  const result = await finalizeResponse.json();
  if (!result.persisted) {
    console.error("Razorpay webhook finalizer did not persist order:", orderId, paymentId, result);
    return NextResponse.json({ error: "Payment captured; order was not persisted." }, { status: 503 });
  }

  return NextResponse.json({ received: true, orderNumber: result.orderNumber });
}
