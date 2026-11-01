import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function safeString(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = safeString(body.session_id, 100);
    const pagePath = safeString(body.page_path, 300);
    if (!/^[a-zA-Z0-9_-]{12,100}$/.test(sessionId) || !pagePath.startsWith("/") || pagePath.startsWith("/admin")) {
      return NextResponse.json({ error: "Invalid traffic event." }, { status: 400 });
    }
    const row = {
      session_id: sessionId,
      event_type: "page_view",
      page_path: pagePath,
      page_title: safeString(body.page_title, 200) || null,
      referrer: safeString(body.referrer, 500) || null,
      source: safeString(body.source, 120) || "direct",
      medium: safeString(body.medium, 120) || "direct",
      campaign: safeString(body.campaign, 160) || null,
      device_type: ["mobile", "desktop", "tablet"].includes(body.device_type) ? body.device_type : "unknown",
      product_slug: safeString(body.product_slug, 160) || null,
    };
    const { error } = await supabaseAdmin().from("website_traffic_events").insert(row);
    if (error) return NextResponse.json({ error: "Traffic analytics is not configured." }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid traffic request." }, { status: 400 });
  }
}
