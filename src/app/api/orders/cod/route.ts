import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface CodLine {
  productId: string;
  quantity: number;
}

interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      lines?: CodLine[];
      shipping?: ShippingDetails;
    };

    const lines = body.lines ?? [];
    const shipping = body.shipping;

    if (!lines.length || !shipping) {
      return NextResponse.json({ error: "Order details are incomplete." }, { status: 400 });
    }

    if (!shipping.fullName?.trim() || !shipping.email?.trim() || !shipping.phone?.trim() ||
        !shipping.line1?.trim() || !shipping.city?.trim() || !shipping.state?.trim() ||
        !/^\d{6}$/.test(shipping.pincode)) {
      return NextResponse.json({ error: "Please provide valid shipping details." }, { status: 400 });
    }

    const quantityByCatalogId = new Map<number, number>();
    for (const line of lines) {
      const catalogId = Number(line.productId);
      if (!Number.isInteger(catalogId) || catalogId < 1 || !Number.isInteger(line.quantity) || line.quantity < 1) {
        return NextResponse.json({ error: "Invalid product or quantity." }, { status: 400 });
      }
      quantityByCatalogId.set(catalogId, (quantityByCatalogId.get(catalogId) ?? 0) + line.quantity);
    }

    const uniqueCatalogIds = [...quantityByCatalogId.keys()];
    const supabase = supabaseAdmin();
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, catalog_id, name, price_inr, stock_quantity, status")
      .in("catalog_id", uniqueCatalogIds);

    if (productsError) throw productsError;
    if (!products || products.length !== uniqueCatalogIds.length) {
      return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
    }

    const productMap = new Map(products.map((product) => [Number(product.catalog_id), product]));
    let subtotalInr = 0;

    for (const [catalogId, quantity] of quantityByCatalogId) {
      const product = productMap.get(catalogId);
      if (!product || product.status !== "live") {
        return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
      }
      if (quantity > product.stock_quantity) {
        return NextResponse.json({ error: `${product.name} does not have enough stock.` }, { status: 400 });
      }
      subtotalInr += product.price_inr * quantity;
    }

    const shippingInr = 0;
    const totalInr = subtotalInr + shippingInr;

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          email: shipping.email.trim().toLowerCase(),
          phone: shipping.phone.trim(),
          full_name: shipping.fullName.trim(),
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (customerError || !customer) throw customerError ?? new Error("Could not save customer.");

    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .insert({
        customer_id: customer.id,
        line1: shipping.line1.trim(),
        line2: shipping.line2?.trim() || null,
        city: shipping.city.trim(),
        state: shipping.state.trim(),
        pincode: shipping.pincode.trim(),
        country: "India",
        phone: shipping.phone.trim(),
      })
      .select("id")
      .single();

    if (addressError || !address) throw addressError ?? new Error("Could not save address.");

    const orderNumber = `HL-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 10)}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        status: "pending",
        subtotal_inr: subtotalInr,
        discount_inr: 0,
        shipping_inr: shippingInr,
        total_inr: totalInr,
        shipping_address_id: address.id,
        payment_status: "unpaid",
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) throw orderError ?? new Error("Could not create order.");

    const orderItems = [...quantityByCatalogId.entries()].map(([catalogId, quantity]) => {
      const product = productMap.get(catalogId)!;
      return {
        order_id: order.id,
        product_id: product.id,
        quantity,
        unit_price_inr: product.price_inr,
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;

    // Reduce stock after the order and its items have been saved.
    // The stock condition prevents a quantity from being reduced below zero.
    for (const [catalogId, quantity] of quantityByCatalogId) {
      const product = productMap.get(catalogId)!;
      const { data: updatedProduct, error: stockError } = await supabase
        .from("products")
        .update({
          stock_quantity: product.stock_quantity - quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id)
        .gte("stock_quantity", quantity)
        .select("id")
        .maybeSingle();

      if (stockError) throw stockError;
      if (!updatedProduct) {
        throw new Error(`Stock changed while placing the order for ${product.name}.`);
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      totalInr,
    });
  } catch (error) {
    console.error("COD order error:", error);
    return NextResponse.json({ error: "Could not place your order. Please try again." }, { status: 500 });
  }
}
