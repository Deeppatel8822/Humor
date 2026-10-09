import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculatePartnerDiscount, creditPartnerReward, findPartnerByCode } from "@/lib/marketingPartner";
import { calculateBundleSavings } from "@/lib/bundles";

interface CodLine { productId: string; slug?: string; quantity: number; }
interface ShippingDetails {
  fullName: string; email: string; phone: string; line1: string; line2?: string;
  city: string; state: string; pincode: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { lines?: CodLine[]; shipping?: ShippingDetails; vendorCode?: string };
    const lines = body.lines ?? [];
    const shipping = body.shipping;
    const vendorCode = String(body.vendorCode || "").trim();
    if (!lines.length || !shipping) return NextResponse.json({ error: "Order details are incomplete." }, { status: 400 });

    if (!shipping.fullName?.trim() || !shipping.email?.trim() || !shipping.phone?.trim() ||
        !shipping.line1?.trim() || !shipping.city?.trim() || !shipping.state?.trim() ||
        !/^\d{6}$/.test(shipping.pincode)) {
      return NextResponse.json({ error: "Please provide valid shipping details." }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    let firstOrderDiscountInr = 0;
    let partnerDiscountInr = 0;
    let partnerMatch: Awaited<ReturnType<typeof findPartnerByCode>> = null;
    if (token) {
      const { data: authData } = await supabase.auth.getUser(token);
      const user = authData.user;
      if (user) {
        const identity = user.email || user.phone || "";
        const field = user.email ? "email" : "phone";
        const { data: customer } = await supabase.from("customers").select("id").eq(field, identity).maybeSingle();
        if (customer) {
          const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", customer.id);
          if ((count ?? 0) === 0) firstOrderDiscountInr = 1;
        }
      }
    }

    const productIds = lines.map((line) => line.productId);
    if (productIds.some((id) => !id || typeof id !== "string")) {
      return NextResponse.json({ error: "Invalid product or quantity." }, { status: 400 });
    }

    const { data: products, error: productsError } = await supabase
      .from("products").select("id,catalog_id,status,price_inr,stock_quantity,name,slug").in("id", productIds);
    if (productsError) throw productsError;

    const productMap = new Map((products ?? []).map((product) => [String(product.id), product]));
    if (vendorCode) {
      partnerMatch = await findPartnerByCode(vendorCode);
      if (!partnerMatch) return NextResponse.json({ error: "Invalid or expired vendor code." }, { status: 400 });
      if (token) {
        const { data: currentAuth } = await supabase.auth.getUser(token);
        if (currentAuth.user?.id === partnerMatch.user.id) return NextResponse.json({ error: "You cannot use your own partner code." }, { status: 400 });
      }
    }
    let subtotalInr = 0;
    const rpcLines = lines.map((line) => {
      const product = productMap.get(line.productId);
      if (!product || product.status !== "live" || !Number.isInteger(line.quantity) || line.quantity < 1 ||
          !Number.isInteger(Number(product.catalog_id)) || product.stock_quantity < line.quantity) {
        throw new Error("Invalid product or quantity.");
      }
      subtotalInr += Number(product.price_inr) * line.quantity;
      return { productId: Number(product.catalog_id), quantity: line.quantity };
    });

    const pricedLines = lines.map((line) => {
      const product = productMap.get(line.productId);
      return { priceInr: Number(product?.price_inr ?? 0), quantity: line.quantity };
    });
    if (partnerMatch) partnerDiscountInr = calculatePartnerDiscount(pricedLines);
    const bundleSavingsInr = calculateBundleSavings(
      lines.map((line) => ({ slug: line.slug || String(productMap.get(line.productId)?.slug || ""), quantity: line.quantity })),
      Array.from(productMap.values()).map((product) => ({ slug: String(product.slug), price_inr: Number(product.price_inr) }))
    );
    const firstOrderDiscount = firstOrderDiscountInr ? Math.round(subtotalInr * 0.10) : 0;
    const combinedDiscount = firstOrderDiscount + partnerDiscountInr + bundleSavingsInr;
    // The account that is logged in owns the order. Shipping email/phone are
    // delivery-contact details and must not decide which account sees the order.
    let rpcShipping = { ...shipping };
    if (token) {
      const { data: accountData, error: accountError } = await supabase.auth.getUser(token);
      if (accountError || !accountData.user?.email) {
        return NextResponse.json({ error: "Your login session expired. Please log in again before ordering." }, { status: 401 });
      }
      rpcShipping.email = accountData.user.email.toLowerCase();
    }

    const { data, error } = await supabase.rpc("create_cod_order", {
      p_lines: rpcLines,
      p_shipping: rpcShipping,
      p_discount: combinedDiscount,
    });
    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.order_number) throw new Error("Could not create the COD order.");

    // Link the new order to the authenticated account without violating the
    // unique customers.phone constraint when that phone is already used elsewhere.
    if (token) {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        const user = authData.user;
        if (!authError && user?.email) {
          let customerId: string | null = null;
          const { data: emailCustomer, error: emailError } = await supabase
            .from("customers")
            .select("id")
            .eq("email", user.email.toLowerCase())
            .maybeSingle();
          if (emailError) throw emailError;
          if (emailCustomer?.id) customerId = String(emailCustomer.id);

          const accountPhone = user.phone || String(user.user_metadata?.phone || "");
          if (!customerId && accountPhone) {
            const { data: phoneCustomer, error: phoneError } = await supabase
              .from("customers")
              .select("id")
              .eq("phone", accountPhone)
              .maybeSingle();
            if (phoneError) throw phoneError;
            if (phoneCustomer?.id) customerId = String(phoneCustomer.id);
          }

          if (!customerId) {
            const { data: createdCustomer, error: createError } = await supabase
              .from("customers")
              .insert({
                email: user.email.toLowerCase(),
                full_name: String(user.user_metadata?.full_name || user.user_metadata?.name || shipping.fullName),
              })
              .select("id")
              .single();
            if (createError) throw createError;
            customerId = String(createdCustomer.id);
          }

          const { error: linkError } = await supabase
            .from("orders")
            .update({ customer_id: customerId })
            .eq("order_number", String(result.order_number));
          if (linkError) throw linkError;
        }
      } catch (linkError) {
        // Do not report a failed checkout after the COD order was already created.
        console.error("Could not link COD order to signed-in customer:", linkError);
      }
    }

    if (partnerMatch) {
      const billedProductAmount = Math.max(0, subtotalInr - combinedDiscount);
      try {
        await creditPartnerReward(partnerMatch.user.id, partnerMatch.partner, billedProductAmount, String(result.order_number));
      } catch (rewardError) {
        console.error("Marketing Partner reward credit failed after COD order:", rewardError);
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.order_number,
      totalInr: Number(result.total_inr),
      discountInr: combinedDiscount,
      bundleSavingsInr,
      codChargeInr: 25,
    });
  } catch (error) {
    console.error("COD order error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "Could not place your order. Please try again.";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
