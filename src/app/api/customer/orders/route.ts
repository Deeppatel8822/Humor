import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please log in to view your orders." }, { status: 401 });

    const admin = supabaseAdmin();
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    const user = authData.user;
    if (authError || !user) return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });

    let customerQuery = admin.from("customers").select("id,email,phone").limit(1);
    if (user.email) customerQuery = customerQuery.eq("email", user.email);
    else if (user.phone) customerQuery = customerQuery.eq("phone", user.phone);
    else return NextResponse.json({ orders: [] });

    const { data: customer, error: customerError } = await customerQuery.maybeSingle();
    if (customerError) throw customerError;
    if (!customer) return NextResponse.json({ orders: [] });

    const { data: orders, error: ordersError } = await admin
      .from("orders")
      .select("id,order_number,status,subtotal_inr,discount_inr,shipping_inr,total_inr,payment_status,created_at")
      .eq("customer_id", customer.id)
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
