import { NextRequest, NextResponse } from "next/server";
import { razorpayClient } from "@/lib/razorpay";
import { getAllProducts } from "@/lib/catalog";
import { calculateBundleSavings } from "@/lib/bundles";
import { calculateCheckoutPricing } from "@/lib/checkoutPricing";
import { calculatePartnerDiscount, findPartnerByCode } from "@/lib/marketingPartner";
import { getStorePricingSettings } from "@/lib/storePricing";
import { LAUNCH_OFFER_ENABLED, getLaunchOfferPrice } from "@/lib/launchOffer";

interface CartLineInput {
  productId: string;
  slug?: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lines: CartLineInput[] = body.lines ?? [];
    const shipping = body.shipping;
    if (!shipping || typeof shipping.fullName !== "string" || !shipping.fullName.trim() ||
        typeof shipping.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email.trim()) ||
        typeof shipping.phone !== "string" || !/^\d{10}$/.test(shipping.phone.trim()) ||
        typeof shipping.line1 !== "string" || !shipping.line1.trim() ||
        typeof shipping.city !== "string" || !shipping.city.trim() ||
        typeof shipping.state !== "string" || !shipping.state.trim() ||
        typeof shipping.pincode !== "string" || !/^\d{6}$/.test(shipping.pincode.trim())) {
      return NextResponse.json({ error: "Please enter a complete and valid shipping address before payment." }, { status: 400 });
    }
    const vendorCode = String(body.vendorCode || "").trim();
    const couponCode = String(body.couponCode || "").trim().toUpperCase();
    if (couponCode && couponCode !== "DEEP1992") return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
    const freeShippingCoupon = couponCode === "DEEP1992";
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let checkoutAccountEmail = "";
    let launchOfferActive = false;
    if (LAUNCH_OFFER_ENABLED && token) {
      const { data: authData, error: authError } = await (await import("@/lib/supabase")).supabaseAdmin().auth.getUser(token);
      if (authError || !authData.user) return NextResponse.json({ error: "Your login session expired. Please log in again." }, { status: 401 });
      const accountEmail = authData.user.email;
      checkoutAccountEmail = String(accountEmail || "").trim().toLowerCase();
      const admin = (await import("@/lib/supabase")).supabaseAdmin();
      if (accountEmail) {
        const { data: customer, error: customerError } = await admin
          .from("customers")
          .select("id")
          .eq("email", accountEmail)
          .maybeSingle();
        if (customerError) throw customerError;
        if (customer) {
          const { count, error: orderCountError } = await admin
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", customer.id);
          if (orderCountError) throw orderCountError;
          launchOfferActive = (count ?? 0) === 0;
        } else {
          launchOfferActive = true;
        }
      }
      // Customers who already used the offer may still purchase at normal prices.
      if (launchOfferActive && vendorCode) {
        return NextResponse.json({ error: "Partner codes and other discounts are unavailable during the launch offer." }, { status: 400 });
      }
    }

    if (
      !Array.isArray(lines) || lines.length === 0 || lines.length > 100 ||
      lines.some((line) =>
        !line ||
        typeof line.productId !== "string" ||
        (line.slug !== undefined && typeof line.slug !== "string") ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 100
      )
    ) {
      return NextResponse.json({ error: "Cart is empty or contains invalid items." }, { status: 400 });
    }

    const products = await getAllProducts();

    // Recompute the total server-side from the trusted product catalog.
    let subtotalInr = 0;
    const quantitiesByProduct = new Map<string, number>();
    for (const line of lines) {
      const product = products.find((p) => (p.id === line.productId || p.slug === line.slug) && p.status === "live");
      if (!product) {
        return NextResponse.json({ error: `Unknown product: ${line.productId}` }, { status: 400 });
      }
      const totalQuantity = (quantitiesByProduct.get(product.id) ?? 0) + line.quantity;
      if (totalQuantity > product.stock_quantity) {
        return NextResponse.json(
          { error: `${product.name} has insufficient stock.` },
          { status: 400 }
        );
      }
      quantitiesByProduct.set(product.id, totalQuantity);
      subtotalInr += (launchOfferActive ? (getLaunchOfferPrice(product) ?? product.price_inr) : product.price_inr) * line.quantity;
    }

    let totalDiscountInr = 0;
    let shippingInr: number;
    let totalInr: number;
    let partnerDiscountInr = 0;
    let bundleSavingsInr = 0;

    if (launchOfferActive) {
      shippingInr = freeShippingCoupon || subtotalInr >= 249 ? 0 : 50;
      totalInr = subtotalInr + shippingInr;
    } else {
      if (vendorCode) {
        const partnerMatch = await findPartnerByCode(vendorCode);
        if (!partnerMatch) return NextResponse.json({ error: "Invalid or expired vendor code." }, { status: 400 });
        if (token) {
          const admin = (await import("@/lib/supabase")).supabaseAdmin();
          const { data: current } = await admin.auth.getUser(token);
          if (current.user?.id === partnerMatch.user.id) return NextResponse.json({ error: "You cannot use your own partner code." }, { status: 400 });
        }
        partnerDiscountInr = calculatePartnerDiscount(lines.map((line) => ({
          priceInr: products.find((p) => p.id === line.productId || p.slug === line.slug)?.price_inr ?? 0,
          quantity: line.quantity,
        })));
      }
      const pricingSettings = await getStorePricingSettings();
      const bundleRule = pricingSettings.discounts.bundle;
      bundleSavingsInr = bundleRule.enabled ? calculateBundleSavings(
        lines.map((line) => ({ slug: line.slug || products.find((p) => p.id === line.productId)?.slug || "", quantity: line.quantity })),
        products,
        bundleRule.type === "percent" ? bundleRule.value : 0
      ) : 0;
      let firstOrderDiscountInr = 0;
      if (token) {
        const admin = (await import("@/lib/supabase")).supabaseAdmin();
        const { data: authData } = await admin.auth.getUser(token);
        if (authData.user) {
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
      const pricing = calculateCheckoutPricing({ subtotalInr, firstOrderDiscountInr, partnerDiscountInr, bundleSavingsInr });
      shippingInr = freeShippingCoupon ? 0 : pricing.shippingInr;
      totalDiscountInr = pricing.totalDiscountInr;
      totalInr = pricing.totalInr - (freeShippingCoupon ? pricing.shippingInr : 0);
    }

    if (freeShippingCoupon) { shippingInr = 0; totalInr = 1; }

    // Razorpay's minimum supported order amount is 100 paise (₹1).
    if (!Number.isSafeInteger(totalInr) || totalInr < 1) {
      return NextResponse.json({ error: "The payable amount must be at least ₹1." }, { status: 400 });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay is not configured: required server environment variables are missing.");
      return NextResponse.json({ error: "Online payment is temporarily unavailable. Please try again later." }, { status: 500 });
    }

    const order = await razorpayClient().orders.create({
      amount: totalInr * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `hl_${Date.now()}`,
      notes: {
        lines: JSON.stringify(lines),
        vendorCode: vendorCode || "",
        launchOffer: launchOfferActive ? "true" : "false",
        couponCode: freeShippingCoupon ? "DEEP1992" : "",
        customerEmail: checkoutAccountEmail,
      },
    });

    // Persist the exact shipping details before opening Razorpay. If this write fails,
    // do not expose the payment order to the browser.
    const { error: draftError } = await (await import("@/lib/supabase")).supabaseAdmin()
      .from("checkout_payment_drafts")
      .upsert({
        razorpay_order_id: order.id,
        shipping: {
          fullName: shipping.fullName.trim(),
          email: shipping.email.trim().toLowerCase(),
          phone: shipping.phone.trim(),
          line1: shipping.line1.trim(),
          line2: typeof shipping.line2 === "string" ? shipping.line2.trim() : "",
          city: shipping.city.trim(),
          state: shipping.state.trim(),
          pincode: shipping.pincode.trim(),
        },
        lines,
        subtotal_inr: subtotalInr,
        shipping_inr: shippingInr,
        vendor_code: vendorCode || "",
        coupon_code: freeShippingCoupon ? "DEEP1992" : "",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "razorpay_order_id" });
    if (draftError) {
      console.error("Checkout address draft persistence failed:", draftError);
      return NextResponse.json({ error: "We could not securely save your delivery details. No payment has been started. Please retry." }, { status: 503 });
    }

    return NextResponse.json({
      razorpayOrderId: order.id,
      amountInr: totalInr,
      subtotalInr,
      shippingInr,
      keyId: process.env.RAZORPAY_KEY_ID,
      discountInr: totalDiscountInr,
      vendorDiscountInr: partnerDiscountInr,
      bundleSavingsInr,
      launchOfferActive,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Could not create order. Try again." }, { status: 500 });
  }
}
