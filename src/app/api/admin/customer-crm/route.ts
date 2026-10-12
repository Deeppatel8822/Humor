import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

async function authorized() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const value = (await cookies()).get("humor_admin")?.value;
  if (!email || !value || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  return value === expected;
}

function normalizeIndianPhone(value: unknown) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  if (digits.startsWith("0") && digits.length === 11) digits = "91" + digits.slice(1);
  return digits.length >= 11 && digits.length <= 15 ? "+" + digits : "";
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = supabaseAdmin();
  const [products, settings, consents, reminders] = await Promise.all([
    db.from("products").select("id,name,slug,category,status").order("name"),
    db.from("product_reorder_settings").select("product_id,reminder_after_days,is_enabled,updated_at"),
    db.from("customer_whatsapp_consent").select("id,customer_id,phone_e164,customer_name,email,consent_status,consent_source,consent_at,opted_out_at,updated_at").order("updated_at", { ascending: false }),
    db.from("whatsapp_reorder_reminders").select("id,customer_name,phone_e164,product_name,due_at,status,message,created_at,sent_at,error_message").order("due_at", { ascending: true }).limit(200),
  ]);
  const failed = [products, settings, consents, reminders].find((result) => result.error);
  if (failed?.error) {
    return NextResponse.json({ error: "CRM tables are not ready. Apply db/migrations/2026-10-12-customer-repeat-purchase-crm.sql in Supabase SQL Editor first." }, { status: 503 });
  }
  return NextResponse.json({
    products: products.data ?? [],
    settings: settings.data ?? [],
    consents: consents.data ?? [],
    reminders: reminders.data ?? [],
    whatsappConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const db = supabaseAdmin();

    if (body.action === "save_setting") {
      const productId = String(body.product_id || "");
      const days = Number(body.reminder_after_days);
      const enabled = Boolean(body.is_enabled);
      if (!productId || !Number.isInteger(days) || days < 1 || days > 365) {
        return NextResponse.json({ error: "Choose a product and a reminder interval from 1 to 365 days." }, { status: 400 });
      }
      const { data, error } = await db.from("product_reorder_settings").upsert({
        product_id: productId, reminder_after_days: days, is_enabled: enabled, updated_at: new Date().toISOString(),
      }, { onConflict: "product_id" }).select().single();
      if (error) return NextResponse.json({ error: "Could not save product reminder settings. Check the CRM migration." }, { status: 500 });
      return NextResponse.json({ setting: data });
    }

    if (body.action === "save_consent") {
      const phone = normalizeIndianPhone(body.phone_e164);
      const status = String(body.consent_status || "");
      const name = String(body.customer_name || "").trim().slice(0, 120);
      const email = String(body.email || "").trim().slice(0, 254);
      const source = String(body.consent_source || "").trim().slice(0, 120);
      if (!phone || !["opted_in", "opted_out", "unknown"].includes(status)) {
        return NextResponse.json({ error: "Enter a valid phone number and consent status." }, { status: 400 });
      }
      if (status === "opted_in" && !source) {
        return NextResponse.json({ error: "Record where and when the customer gave WhatsApp consent before opting them in." }, { status: 400 });
      }
      const now = new Date().toISOString();
      const { data, error } = await db.from("customer_whatsapp_consent").upsert({
        phone_e164: phone, customer_name: name || null, email: email || null, consent_status: status,
        consent_source: source || null, consent_at: status === "opted_in" ? now : null,
        opted_out_at: status === "opted_out" ? now : null, updated_at: now,
      }, { onConflict: "phone_e164" }).select().single();
      if (error) return NextResponse.json({ error: "Could not save WhatsApp consent. Check the CRM migration." }, { status: 500 });
      if (status !== "opted_in") {
        await db.from("whatsapp_reorder_reminders").update({ status: "cancelled", updated_at: now })
          .eq("phone_e164", phone).in("status", ["pending", "ready"]);
      }
      return NextResponse.json({ consent: data });
    }

    if (body.action === "generate_due") {
      const [ordersResult, settingsResult, consentsResult] = await Promise.all([
        db.from("orders").select("id,customer_id,created_at,status,customer:customers(full_name,email,phone),address:addresses(phone),order_items(product_id,product:products(name))")
          .in("status", ["delivered"]).order("created_at", { ascending: false }).limit(1000),
        db.from("product_reorder_settings").select("product_id,reminder_after_days,is_enabled").eq("is_enabled", true),
        db.from("customer_whatsapp_consent").select("id,customer_id,phone_e164,customer_name,email,consent_status").eq("consent_status", "opted_in"),
      ]);
      if (ordersResult.error || settingsResult.error || consentsResult.error) {
        return NextResponse.json({ error: "Could not calculate due reminders. Check CRM migration and database relations." }, { status: 500 });
      }
      const settingMap = new Map((settingsResult.data ?? []).map((x) => [x.product_id, x]));
      const consentMap = new Map((consentsResult.data ?? []).map((x) => [x.phone_e164, x]));
      const now = Date.now();
      const rows: Record<string, unknown>[] = [];
      for (const order of ordersResult.data ?? []) {
        const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer;
        const address = Array.isArray(order.address) ? order.address[0] : order.address;
        const phone = normalizeIndianPhone(customer?.phone || address?.phone);
        const consent = phone ? consentMap.get(phone) : undefined;
        if (!phone || !consent) continue;
        for (const item of order.order_items ?? []) {
          const setting = settingMap.get(item.product_id);
          if (!setting) continue;
          const dueAt = new Date(new Date(order.created_at).getTime() + setting.reminder_after_days * 86400000);
          if (dueAt.getTime() > now) continue;
          const product = Array.isArray(item.product) ? item.product[0] : item.product;
          rows.push({
            consent_id: consent.id, customer_id: order.customer_id || null, order_id: order.id,
            product_id: item.product_id, phone_e164: phone,
            customer_name: customer?.full_name || consent.customer_name || null,
            product_name: product?.name || "Your product", due_at: dueAt.toISOString(),
            status: "pending",
            message: `Hi ${customer?.full_name || consent.customer_name || "there"}, it's time to restock ${product?.name || "your product"} from Humor Luxury. Visit humorluxury.com to shop again. Reply STOP if you no longer want WhatsApp reminders.`,
            updated_at: new Date().toISOString(),
          });
        }
      }
      let created = 0;
      if (rows.length) {
        const { data, error } = await db.from("whatsapp_reorder_reminders")
          .upsert(rows, { onConflict: "order_id,product_id,phone_e164", ignoreDuplicates: true }).select("id");
        if (error) return NextResponse.json({ error: "Could not create reminders. Check CRM migration." }, { status: 500 });
        created = data?.length ?? 0;
      }
      return NextResponse.json({ success: true, created, checked: rows.length, note: "Reminders are queued only. No WhatsApp message has been sent." });
    }

    return NextResponse.json({ error: "Unknown CRM action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
