import { NextResponse } from "next/server";
import { isShopifyConfigured } from "@/lib/shopify/client";

// Lets the client-side cart know whether to use Shopify's hosted checkout
// or fall back to the local demo checkout — see CartContext.tsx.
export async function GET() {
  return NextResponse.json({ configured: isShopifyConfigured() });
}
