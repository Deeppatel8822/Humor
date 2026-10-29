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
    return NextResponse.json({ enabled: true, eligible: false, prices: {}, basePrices }, { headers: { "Cache-Control": "no-store" } });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  let eligible = !error && Boolean(data.user);

  // Launch pricing is for the first order only. Existing customers can still
  // check out at regular catalog prices instead of being blocked entirely.
  if (eligible && data.user) {
    const email = data.user.email;
    if (!email) {
      eligible = false;
    } else {
      const { data: customer, error: customerError } = await admin
        .from("customers")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (customerError) {
        console.error("Launch offer eligibility lookup failed:", customerError);
        eligible = false;
      } else if (customer) {
        const { count, error: ordersError } = await admin
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", customer.id);
        if (ordersError) {
          console.error("Launch offer order history lookup failed:", ordersError);
          eligible = false;
        } else {
          eligible = (count ?? 0) === 0;
        }
      }
    }
  }

  return NextResponse.json({
    enabled: true,
    eligible,
    prices: eligible ? getLaunchOfferProductPrices() : {},
    basePrices,
  }, { headers: { "Cache-Control": "no-store" } });
}
