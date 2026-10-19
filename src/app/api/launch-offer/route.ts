import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { LAUNCH_OFFER_ENABLED, getLaunchOfferProductPrices } from "@/lib/launchOffer";
import { getAllProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const products = await getAllProducts();
  const basePrices = Object.fromEntries(products.map((product) => [product.slug, product.price_inr]));
  if (!LAUNCH_OFFER_ENABLED) {
    return NextResponse.json({ enabled: false, eligible: false, prices: {}, basePrices }, { headers: { "Cache-Control": "no-store" } });
  }

  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return NextResponse.json({ enabled: true, eligible: false, prices: {} }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await supabaseAdmin().auth.getUser(token);
  const eligible = !error && Boolean(data.user);
  return NextResponse.json({
    enabled: true,
    eligible,
    prices: eligible ? getLaunchOfferProductPrices() : {},
    basePrices,
  }, { headers: { "Cache-Control": "no-store" } });
}
