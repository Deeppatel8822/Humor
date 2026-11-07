import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { shipmozoRequest, ShipmozoError } from "@/lib/shipmozo";

function validAdmin(value?: string) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!email || !value || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  const a = Buffer.from(value), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const store = await cookies();
  if (!validAdmin(store.get("humor_admin")?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const awb = new URL(request.url).searchParams.get("awb_number")?.trim();
  if (!awb) return NextResponse.json({ error: "AWB number is required." }, { status: 400 });
  try {
    const result = await shipmozoRequest<any>(`track-order?awb_number=${encodeURIComponent(awb)}`);
    const detail = result?.data || {};
    const { error } = await supabaseAdmin().from("shipmozo_shipments").update({
      shipment_status: String(detail.current_status || "tracking_updated"),
      tracking_url: detail.tracking_url || null,
      response_snapshot: result,
      updated_at: new Date().toISOString(),
    }).eq("awb_number", awb);
    if (error) throw error;
    return NextResponse.json({ success: true, tracking: detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch tracking.";
    return NextResponse.json({ error: message }, { status: error instanceof ShipmozoError ? error.status : 502 });
  }
}
