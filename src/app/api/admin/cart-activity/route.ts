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
const eventTypes = ["product_view","add_to_cart","remove_from_cart","quantity_updated","checkout_started","purchase_completed","cart_cleared"];
function safeString(v: unknown, max = 200) { return String(v ?? "").trim().slice(0, max); }
function normalizePhone(v: unknown) { let digits = String(v ?? "").replace(/\\D/g, ""); if (digits.length === 10) digits = "91" + digits; if (digits.startsWith("0") && digits.length === 11) digits = "91" + digits.slice(1); return digits.length >= 11 && digits.length <= 15 ? "+" + digits : ""; }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = safeString(body.session_id, 100);
    const eventType = safeString(body.event_type, 40);
    if (!sessionId || !/^[a-zA-Z0-9_-]{12,100}$/.test(sessionId) || !eventTypes.includes(eventType)) {
      return NextResponse.json({ error: "Invalid cart activity." }, { status: 400 });
    }
    const lines = Array.isArray(body.lines) ? body.lines.slice(0, 50) : [];
    const db = supabaseAdmin();
    const contact = {
      customer_name: safeString(body.customer_name, 120) || null,
      email: safeString(body.email, 254).toLowerCase() || null,
      phone: safeString(body.phone, 32) || null,
    };
    const rows = lines.length ? lines : [null];
    const events = rows.map((line: any) => ({
      session_id: sessionId,
      event_type: eventType,
      customer_name: contact.customer_name,
      email: contact.email,
      phone: normalizePhone(contact.phone) || null,
      product_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(line?.productId || "")) ? line.productId : null,
      product_slug: safeString(line?.slug, 160) || null,
      product_name: safeString(line?.name, 200) || null,
      unit_price_inr: Math.max(0, Math.round(Number(line?.price_inr) || 0)),
      quantity: Math.max(1, Math.min(999, Math.round(Number(line?.quantity) || 1))),
      cart_value_inr: Math.max(0, Math.round(Number(body.cart_value_inr) || 0)),
      page_path: safeString(body.page_path, 300) || null,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
    }));
    const { error } = await db.from("cart_activity_events").insert(events);
    if (error) return NextResponse.json({ error: "Cart tracking is not configured. Apply the cart activity migration." }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid cart activity request." }, { status: 400 });
  }
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = supabaseAdmin();
  const [eventsResult, offerResult, consentResult] = await Promise.all([
    db.from("cart_activity_events").select("id,session_id,event_type,customer_name,email,phone,product_id,product_slug,product_name,unit_price_inr,quantity,cart_value_inr,page_path,created_at").order("created_at", { ascending: false }).limit(1000),
    db.from("abandoned_cart_offer_settings").select("id,enabled,offer_code,offer_text,discount_label,expires_at,reminder_after_minutes").eq("id", 1).maybeSingle(),
    db.from("customer_whatsapp_consent").select("phone_e164,consent_status").eq("consent_status", "opted_in"),
  ]);
  if (eventsResult.error || offerResult.error) return NextResponse.json({ error: "Cart tracking tables are not ready. Apply db/migrations/2026-10-12-cart-activity-abandoned-cart.sql in Supabase SQL Editor." }, { status: 503 });
  return NextResponse.json({ events: eventsResult.data ?? [], offer: offerResult.data ?? null, optedInPhones: (consentResult.data ?? []).map((row) => row.phone_e164) });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const minutes = Number(body.reminder_after_minutes);
    const enabled = Boolean(body.enabled);
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 10080) return NextResponse.json({ error: "Reminder delay must be 15 minutes to 7 days." }, { status: 400 });
    const expiry = body.expires_at ? new Date(body.expires_at) : null;
    if (expiry && Number.isNaN(expiry.getTime())) return NextResponse.json({ error: "Invalid offer expiry date." }, { status: 400 });
    const update = {
      id: 1, enabled, offer_code: safeString(body.offer_code, 40) || null,
      offer_text: safeString(body.offer_text, 500) || "Your cart is waiting. Complete checkout to enjoy this offer.",
      discount_label: safeString(body.discount_label, 80) || "Special offer",
      expires_at: expiry?.toISOString() ?? null, reminder_after_minutes: minutes, updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin().from("abandoned_cart_offer_settings").upsert(update, { onConflict: "id" }).select().single();
    if (error) return NextResponse.json({ error: "Could not save abandoned-cart offer settings." }, { status: 500 });
    return NextResponse.json({ offer: data });
  } catch {
    return NextResponse.json({ error: "Invalid offer settings." }, { status: 400 });
  }
}
