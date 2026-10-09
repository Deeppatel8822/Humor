import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please log in to link your order." }, { status: 401 });

    const body = await request.json() as { orderNumber?: string; checkoutEmail?: string };
    const orderNumber = String(body.orderNumber || "").trim();
    const checkoutEmail = String(body.checkoutEmail || "").trim().toLowerCase();
    if (!orderNumber || !checkoutEmail) {
      return NextResponse.json({ error: "Enter your order number and the email used at checkout." }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    const user = authData.user;
    if (authError || !user?.email) {
      return NextResponse.json({ error: "Your account must have a verified email to link an order." }, { status: 401 });
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id,customer_id,order_number")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order?.customer_id) {
      return NextResponse.json({ error: "We could not find that order. Check the order number and try again." }, { status: 404 });
    }

    const { data: checkoutCustomer, error: checkoutCustomerError } = await admin
      .from("customers")
      .select("id,email")
      .eq("id", order.customer_id)
      .maybeSingle();
    if (checkoutCustomerError) throw checkoutCustomerError;
    if (!checkoutCustomer?.email || String(checkoutCustomer.email).trim().toLowerCase() !== checkoutEmail) {
      return NextResponse.json({ error: "The checkout email does not match this order. Please enter the email used when placing it." }, { status: 403 });
    }

    const { data: accountCustomer, error: accountCustomerError } = await admin
      .from("customers")
      .upsert({
        email: user.email.toLowerCase(),
        phone: user.phone || String(user.user_metadata?.phone || "") || null,
        full_name: String(user.user_metadata?.full_name || user.user_metadata?.name || "") || null,
      }, { onConflict: "email" })
      .select("id")
      .single();
    if (accountCustomerError) throw accountCustomerError;

    const { error: linkError } = await admin
      .from("orders")
      .update({ customer_id: accountCustomer.id })
      .eq("id", order.id);
    if (linkError) throw linkError;

    return NextResponse.json({ success: true, message: "Order linked to your account." });
  } catch (error) {
    console.error("Order account linking error:", error);
    return NextResponse.json({ error: "Could not link this order right now. Please try again." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please log in to view your orders." }, { status: 401 });

    const admin = supabaseAdmin();
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    const user = authData.user;
    if (authError || !user) return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });

    const customerIds: string[] = [];
    if (user.email) {
      const { data: emailCustomer, error: emailError } = await admin
        .from("customers")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      if (emailError) throw emailError;
      if (emailCustomer?.id) customerIds.push(String(emailCustomer.id));
    }
    // COD orders may have been saved against the checkout phone or shipping email.
    const accountPhone = user.phone || String(user.user_metadata?.phone || "");
    if (accountPhone) {
      const { data: phoneCustomer, error: phoneError } = await admin
        .from("customers")
        .select("id")
        .eq("phone", accountPhone)
        .maybeSingle();
      if (phoneError) throw phoneError;
      if (phoneCustomer?.id && !customerIds.includes(String(phoneCustomer.id))) {
        customerIds.push(String(phoneCustomer.id));
      }
    }
    if (!customerIds.length) return NextResponse.json({ orders: [] });

    const { data: orders, error: ordersError } = await admin
      .from("orders")
      .select("id,order_number,status,subtotal_inr,discount_inr,shipping_inr,total_inr,payment_status,created_at")
      .in("customer_id", customerIds)
      .order("created_at", { ascending: false })
      .limit(20);
    if (ordersError) throw ordersError;

    const orderIds = (orders || []).map((order) => order.id);
    if (!orderIds.length) return NextResponse.json({ orders: [] });

    const { data: items, error: itemsError } = await admin
      .from("order_items")
      .select("order_id,product_id,quantity,unit_price_inr")
      .in("order_id", orderIds);
    if (itemsError) throw itemsError;

    const productIds = Array.from(new Set((items || []).map((item) => String(item.product_id))));
    let products: { id: string | number; name: string; slug?: string | null }[] = [];
    if (productIds.length) {
      const { data, error } = await admin.from("products").select("id,name,slug").in("id", productIds);
      if (error) {
        // Some legacy orders use catalog IDs rather than database product IDs.
        console.warn("Could not resolve order products by database ID:", error.message);
      } else {
        products = (data || []) as typeof products;
      }
    }

    const response = (orders || []).map((order) => ({
      ...order,
      items: (items || []).filter((item) => String(item.order_id) === String(order.id)).map((item) => ({
        ...item,
        product: products.find((product) => String(product.id) === String(item.product_id)) || null,
      })),
    }));

    return NextResponse.json({ orders: response });
  } catch (error) {
    console.error("Customer order history error:", error);
    return NextResponse.json({ error: "Could not load your order history right now." }, { status: 500 });
  }
}
