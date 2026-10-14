import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { razorpayClient } from "@/lib/razorpay";
import { getAllProducts } from "@/lib/catalog";
import { calculateBundleSavings } from "@/lib/bundles";
import { calculateCheckoutPricing } from "@/lib/checkoutPricing";
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
  const pricing = calculateCheckoutPricing({
    subtotalInr,
    firstOrderDiscountInr,
    partnerDiscountInr,
    bundleSavingsInr,
  });
  const { shippingInr: calculatedShippingInr, totalDiscountInr, totalInr } = pricing;
  if (shippingInr !== calculatedShippingInr) {
    return NextResponse.json({ error: "Shipping charge does not match checkout pricing." }, { status: 400 });
  }

  // Confirm the captured payment against the trusted, server-calculated total.
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

    // The cart and partner code must match the immutable values saved when
    // the Razorpay order was created, not merely add up to the same amount.
    let createdLines: { productId?: string; slug?: string; quantity?: number }[];
    try {
      createdLines = JSON.parse(String(razorpayOrder.notes?.lines ?? ""));
    } catch {
      return NextResponse.json({ error: "Razorpay order is missing valid cart details." }, { status: 400 });
    }
    if (!Array.isArray(createdLines)) {
      return NextResponse.json({ error: "Razorpay order is missing valid cart details." }, { status: 400 });
    }
    const normalizeCart = (items: { productId?: string; slug?: string; quantity?: number }[]) => {
      const totals = new Map<string, number>();
      for (const item of items) {
        if (!item || !Number.isSafeInteger(item.quantity) || Number(item.quantity) < 1) return null;
        const product = products.find((p) => p.id === item.productId || p.slug === item.slug);
        if (!product || product.status !== "live") return null;
        totals.set(product.id, (totals.get(product.id) ?? 0) + Number(item.quantity));
      }
      return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b));
    };
    const submittedCart = normalizeCart(lines);
    const createdCart = normalizeCart(createdLines);
    const savedVendorCode = String(razorpayOrder.notes?.vendorCode ?? "").trim().toUpperCase();
    if (
      !submittedCart || !createdCart ||
      JSON.stringify(submittedCart) !== JSON.stringify(createdCart) ||
      savedVendorCode !== String(vendorCode ?? "").trim().toUpperCase()
    ) {
      return NextResponse.json({ error: "Cart or partner code differs from the original Razorpay checkout." }, { status: 400 });
    }
  } catch (error) {
    console.error("Razorpay payment status lookup failed:", error);
    return NextResponse.json({ error: "Could not confirm captured payment with Razorpay. Please retry." }, { status: 503 });
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

      // Recover a paid order if a previous callback persisted the order row but
      // failed before order_items were inserted. Compare aggregate quantities so
      // repeated product lines are handled safely and never silently duplicated.
      const { data: existingItems, error: existingItemsError } = await admin
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", existingOrder.id);
      if (existingItemsError) throw existingItemsError;

      const expectedItems = new Map<string, { quantity: number; unitPrice: number }>();
      for (const line of lines) {
        const product = products.find((p) => p.id === line.productId || p.slug === line.slug);
        if (!product) {
          return NextResponse.json({ error: "Could not reconcile items for this paid order." }, { status: 409 });
        }
        const previous = expectedItems.get(product.id);
        expectedItems.set(product.id, {
          quantity: (previous?.quantity ?? 0) + line.quantity,
          unitPrice: product.price_inr,
        });
      }
      const actualQuantities = new Map<string, number>();
      for (const item of existingItems ?? []) {
        actualQuantities.set(item.product_id, (actualQuantities.get(item.product_id) ?? 0) + Number(item.quantity));
      }
      const missingItems: { order_id: string; product_id: string; quantity: number; unit_price_inr: number }[] = [];
      for (const [productId, expected] of expectedItems) {
        const actual = actualQuantities.get(productId) ?? 0;
        if (actual > expected.quantity) {
          return NextResponse.json({ error: "This paid order has inconsistent item quantities and needs admin review." }, { status: 409 });
        }
        if (actual < expected.quantity) {
          missingItems.push({
            order_id: existingOrder.id,
            product_id: productId,
            quantity: expected.quantity - actual,
            unit_price_inr: expected.unitPrice,
          });
        }
      }
      if ([...actualQuantities.keys()].some((productId) => !expectedItems.has(productId))) {
        return NextResponse.json({ error: "This paid order contains unexpected items and needs admin review." }, { status: 409 });
      }
      if (missingItems.length > 0) {
        const { error: repairItemsError } = await admin.from("order_items").insert(missingItems);
        if (repairItemsError) throw repairItemsError;
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

    const quantitiesByProduct = new Map<string, { quantity: number; unitPrice: number }>();
    for (const line of lines) {
      const product = products.find((p) => p.id === line.productId || p.slug === line.slug);
      if (!product) throw new Error("Product disappeared while persisting paid order items.");
      const previous = quantitiesByProduct.get(product.id);
      quantitiesByProduct.set(product.id, {
        quantity: (previous?.quantity ?? 0) + line.quantity,
        unitPrice: product.price_inr,
      });
    }
    const orderItems = [...quantitiesByProduct.entries()].map(([productId, item]) => ({
      order_id: order.id,
      product_id: productId,
      quantity: item.quantity,
      unit_price_inr: item.unitPrice,
    }));
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
