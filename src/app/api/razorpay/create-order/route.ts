import { NextRequest, NextResponse } from "next/server";
import { razorpayClient } from "@/lib/razorpay";
import { products } from "@/lib/products";

interface CartLineInput {
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lines: CartLineInput[] = body.lines ?? [];

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    // Recompute the total server-side from the trusted product catalog.
    // TODO: once Supabase is connected, replace `products` with a live
    // query against the `products` table (select id, price_inr, stock_quantity).
    let subtotalInr = 0;
    for (const line of lines) {
      const product = products.find((p) => p.id === line.productId && p.status === "live");
      if (!product) {
        return NextResponse.json({ error: `Unknown product: ${line.productId}` }, { status: 400 });
      }
      if (line.quantity < 1 || line.quantity > product.stock_quantity) {
        return NextResponse.json(
          { error: `${product.name} has insufficient stock.` },
          { status: 400 }
        );
      }
      subtotalInr += product.price_inr * line.quantity;
    }

    const freeShippingThreshold = 599;
    const shippingInr = subtotalInr >= freeShippingThreshold ? 0 : 60;
    const totalInr = subtotalInr + shippingInr;

    const order = await razorpayClient().orders.create({
      amount: totalInr * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `hl_${Date.now()}`,
      notes: { lines: JSON.stringify(lines) },
    });

    return NextResponse.json({
      razorpayOrderId: order.id,
      amountInr: totalInr,
      subtotalInr,
      shippingInr,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Could not create order. Try again." }, { status: 500 });
  }
}
