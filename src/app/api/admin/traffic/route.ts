import { validAdminSession } from "@/lib/adminAuth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

async function authorized() { return validAdminSession((await cookies()).get("humor_admin")?.value); }

export async function GET(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "7d";
  const days = range === "today" ? 1 : range === "30d" ? 30 : 7;
  const since = new Date();
  if (range === "today") since.setHours(0, 0, 0, 0);
  else since.setDate(since.getDate() - days);
  const db = supabaseAdmin();
  const [trafficResult, cartResult] = await Promise.all([
    db.from("website_traffic_events")
      .select("id,session_id,page_path,page_title,referrer,source,medium,campaign,device_type,product_slug,created_at")
      .gte("created_at", since.toISOString()).order("created_at", { ascending: false }).limit(10000),
    db.from("cart_activity_events")
      .select("id,session_id,event_type,product_slug,product_name,page_path,created_at")
      .gte("created_at", since.toISOString()).order("created_at", { ascending: false }).limit(10000),
  ]);
  if (trafficResult.error) {
    console.error("[admin/traffic] website_traffic_events query failed:", trafficResult.error);
    return NextResponse.json({
      error: "Traffic analytics query failed.",
      details: trafficResult.error.message,
      code: trafficResult.error.code,
      hint: trafficResult.error.hint,
    }, { status: 503 });
  }
  return NextResponse.json({
    events: trafficResult.data ?? [],
    cartEvents: cartResult.error ? [] : cartResult.data ?? [],
    range,
    since: since.toISOString(),
  });
}
