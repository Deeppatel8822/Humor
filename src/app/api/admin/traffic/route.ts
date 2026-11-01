import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

async function authorized() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const value = (await cookies()).get("humor_admin")?.value;
  if (!email || !value || !secret) return false;
  return value === crypto.createHmac("sha256", secret).update(email).digest("hex");
}

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
  if (trafficResult.error) return NextResponse.json({ error: "Traffic table is not ready. Please apply the website traffic migration." }, { status: 503 });
  return NextResponse.json({
    events: trafficResult.data ?? [],
    cartEvents: cartResult.error ? [] : cartResult.data ?? [],
    range,
    since: since.toISOString(),
  });
}
