import { NextRequest, NextResponse } from "next/server";
import { createCart } from "@/lib/shopify/cart";
import { isShopifyConfigured } from "@/lib/shopify/client";

export async function POST(req: NextRequest) {
  if (!isShopifyConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured on this deployment." },
      { status: 501 }
    );
  }

  try {
    const body = await req.json();
    const lines: { variantId: string; quantity: number }[] = body.lines ?? [];

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }
    if (lines.some((l) => !l.variantId)) {
      return NextResponse.json(
        { error: "One or more cart items are missing a Shopify variant ID." },
        { status: 400 }
      );
    }

    const cart = await createCart(
      lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity }))
    );

    return NextResponse.json({ checkoutUrl: cart.checkoutUrl, cartId: cart.id });
  } catch (err) {
    console.error("Shopify cart creation failed:", err);
    return NextResponse.json({ error: "Could not start Shopify checkout." }, { status: 500 });
  }
}
