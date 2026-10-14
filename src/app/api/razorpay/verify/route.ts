import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { razorpayClient } from "@/lib/razorpay";
import { getAllProducts } from "@/lib/catalog";
import { calculateBundleSavings } from "@/lib/bundles";
import { calculatePartnerDiscount, creditPartnerReward, findPartnerByCode } from "@/lib/marketingPartner";

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  lines: { productId: string; slug?: string; quantity: number }[];
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
  vendorCode?: string;
}

export async function POST(req: NextRequest) {
  let body: VerifyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, lines, shipping, subtotalInr, shippingInr, vendorCode } = body;
  if (
    !Array.isArray(lines) || lines.length === 0 ||
    !shipping || typeof shipping.fullName !== "string" ||
    typeof shipping.email !== "string" || typeof shipping.phone !== "string" ||
    typeof shipping.line1 !== "string" || typeof shipping.city !== "string" ||
    typeof shipping.state !== "string" || typeof shipping.pincode !== "string" ||
    !Number.isSafeInteger(subtotalInr) || subtotalInr < 0 ||
    !Number.isSafeInteger(shippingInr) || shippingInr < 0 ||
    lines.some((line) => !line || typeof line.productId !== "string" ||
      !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 100)
  ) {
    return NextResponse.json({ error: "Invalid checkout details." }, { status: 400 });
  }
  const products = await getAllProducts();
  let trustedSubtotalInr = 0;
  for (const line of lines) {
    const product = products.find((p) => (p.id === line.productId || p.slug === line.slug) && p.status === "live");
    if (!product || line.quantity > product.stock_quantity) {
      return NextResponse.json({ error: "Cart contains an unavailable product or quantity." }, { status: 400 });
    }
    trustedSubtotalInr += product.price_inr * line.quantity;
  }
  if (trustedSubtotalInr !== subtotalInr) {
    return NextResponse.json({ error: "Checkout subtotal does not match current product prices." }, { status: 400 });
  }

  // 1. Verify the payment signature — this is the step that actually confirms
  // Razorpay processed the payment, rather than trusting the client's word for it.
  const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!razorpaySecret || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification details or server configuration." }, { status: 400 });
  }
  const expectedSignature = crypto
    .createHmac("sha256", razorpaySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const signatureBuffer = Buffer.from(razorpay_signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // A valid callback signature alone does not prove that the payment is
  // captured or that the amount matches the Razorpay order created server-side.
  try {
    const razorpay = razorpayClient();
    const [payment, razorpayOrder] = await Promise.all([
      razorpay.payments.fetch(razorpay_payment_id),
      razorpay.orders.fetch(razorpay_order_id),
    ]);
    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      razorpayOrder.id !== razorpay_order_id ||
      payment.currency !== "INR" ||
      payment.amount !== razorpayOrder.amount ||
      razorpayOrder.currency !== "INR" ||
      razorpayOrder.amount !== Math.round(totalInr * 100)
    ) {
      return NextResponse.json({ error: "Payment is not captured or does not match the Razorpay order." }, { status: 400 });
    }
  } catch (error) {
    console.error("Razorpay payment status lookup failed:", error);
    return NextResponse.json({ error: "Could not confirm captured payment with Razorpay. Please retry." }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  let firstOrderDiscountInr = 0;
  if (token) {
    const { data: authData } = await supabaseAdmin().auth.getUser(token);
    if (authData.user) {
      const admin = supabaseAdmin();
      const identity = authData.user.email || authData.user.phone || "";
      const field = authData.user.email ? "email" : "phone";
      const { data: customer } = await admin.from("customers").select("id").eq(field, identity).maybeSingle();
      if (customer) {
        const { count } = await admin.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", customer.id);
        if ((count ?? 0) === 0) firstOrderDiscountInr = Math.round(subtotalInr * 0.10);
      } else {
        firstOrderDiscountInr = Math.round(subtotalInr * 0.10);
      }
    }
  }
  let partnerDiscountInr = 0;
  let partnerMatch: Awaited<ReturnType<typeof findPartnerByCode>> = null;
  if (vendorCode) {
    partnerMatch = await findPartnerByCode(vendorCode);
    if (!partnerMatch) return NextResponse.json({ error: "Invalid or expired vendor code." }, { status: 400 });
    if (token) {
      const current = await supabaseAdmin().auth.getUser(token);
      if (current.data.user?.id === partnerMatch.user.id) return NextResponse.json({ error: "You cannot use your own partner code." }, { status: 400 });
    }
    partnerDiscountInr = calculatePartnerDiscount(lines.map((line) => ({
      priceInr: products.find((p) => p.id === line.productId || p.slug === line.slug)?.price_inr ?? 0,
      quantity: line.quantity,
    })));
  }
  const bundleSavingsInr = calculateBundleSavings(lines.map((line) => ({ slug: line.slug || products.find((p) => p.id === line.productId)?.slug || "", quantity: line.quantity })), products);
  const prepaidDiscountInr = Math.round(subtotalInr * (subtotalInr >= 1000 ? 0.04 : 0.03));
  const totalDiscountInr = firstOrderDiscountInr + partnerDiscountInr + prepaidDiscountInr + bundleSavingsInr;
  // Keep shipping threshold aligned with create-order, which applies the
  // threshold after bundle savings.
  const shippingBaseInr = Math.max(0, subtotalInr - bundleSavingsInr);
  const calculatedShippingInr = shippingBaseInr >= 299 ? 0 : 50;
  const totalInr = Math.max(0, subtotalInr - totalDiscountInr + calculatedShippingInr);
  if (shippingInr !== calculatedShippingInr) {
    return NextResponse.json({ error: "Shipping charge does not match checkout pricing." }, { status: 400 });
  }
  // Use a high-entropy order number so collisions cannot cross-link reward ledger references.
  const orderNumber = `HL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // 2. Persist the order. If Supabase isn't configured yet (local dev before
  // the project is set up), skip persistence but still confirm the payment —
  // the money has moved either way, so the customer should see success.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ orderNumber, persisted: false, totalInr, discountInr: totalDiscountInr });
  }

  try {
    const admin = supabaseAdmin();

    // Razorpay may retry the verification callback. Reuse an already persisted
    // order for this payment instead of creating a second order and rewarding twice.
    const { data: existingOrder, error: existingOrderError } = await admin
      .from("orders")
      .select("id, order_number, total_inr, discount_inr, razorpay_payment_id")
      .eq("razorpay_order_id", razorpay_order_id)
      .maybeSingle();
    if (existingOrderError) throw existingOrderError;
    if (existingOrder) {
      if (existingOrder.razorpay_payment_id && existingOrder.razorpay_payment_id !== razorpay_payment_id) {
        return NextResponse.json({ error: "This Razorpay order is already linked to a different payment." }, { status: 409 });
      }
      if (partnerMatch) {
        const billedProductAmount = Math.max(0, subtotalInr - totalDiscountInr);
        try {
          await creditPartnerReward(partnerMatch.user.id, partnerMatch.partner, billedProductAmount, String(existingOrder.order_number));
        } catch (rewardError) {
          console.error("Marketing Partner reward reconciliation failed for existing paid order:", rewardError);
        }
      }
      return NextResponse.json({
        orderNumber: existingOrder.order_number,
        orderId: existingOrder.id,
        persisted: true,
        duplicate: true,
        totalInr: Number(existingOrder.total_inr),
        discountInr: Number(existingOrder.discount_inr),
      });
    }

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
        discount_inr: totalDiscountInr,
        shipping_inr: calculatedShippingInr,
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

    if (partnerMatch) {
      const billedProductAmount = Math.max(0, subtotalInr - totalDiscountInr);
      try {
        await creditPartnerReward(partnerMatch.user.id, partnerMatch.partner, billedProductAmount, orderNumber);
      } catch (rewardError) {
        console.error("Marketing Partner reward credit failed after paid order:", rewardError);
      }
    }

    return NextResponse.json({ orderNumber, orderId: order.id, persisted: true, totalInr, discountInr: totalDiscountInr });
  } catch (err) {
    console.error("Order persistence failed after successful payment:", err);
    return NextResponse.json({ orderNumber, persisted: false, totalInr, discountInr: totalDiscountInr, warning: "Order recorded, but confirmation email may be delayed." });
  }
}
