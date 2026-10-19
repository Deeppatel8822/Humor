import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

function authorized() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return async () => {
    const cookieStore = await cookies();
    const value = cookieStore.get("humor_admin")?.value;
    if (!email || !value || !secret) return false;
    const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
    return value === expected;
  };
}

export async function GET() {
  if (!(await authorized())()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("customers").select("id,email,phone,full_name,created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load customers." }, { status: 500 });

  // Mark approved marketing partners directly in the customer list.
  const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const partnerByUserId = new Map<string, { status: string; code?: string; businessName?: string }>();
  for (const user of usersData?.users ?? []) {
    const partner = user.app_metadata?.marketing_partner;
    if (partner && typeof partner === "object" && partner.status === "approved") {
      partnerByUserId.set(user.id, {
        status: "approved",
        code: typeof partner.code === "string" ? partner.code : undefined,
        businessName: typeof partner.businessName === "string" ? partner.businessName : undefined,
      });
    }
  }

  const authUsers = usersData?.users ?? [];
  const accountUserIds = new Set(authUsers.map((user) => user.id));
  const accountByEmail = new Map<string, (typeof authUsers)[number]>();
  for (const user of authUsers) { const email = String(user.email || "").trim().toLowerCase(); if (email) accountByEmail.set(email, user); }
  const accountByPhone = new Map<string, (typeof authUsers)[number]>();
  for (const user of authUsers) { const phone = String(user.phone || "").replace(/\\D/g, ""); if (phone) accountByPhone.set(phone, user); }
  const customersByIdentity = new Map<string, any>();
  for (const customer of data ?? []) {
    const email = String(customer.email || "").trim().toLowerCase();
    const phone = String(customer.phone || "").replace(/\\D/g, "");
    const authUser = (email && accountByEmail.get(email)) || (phone && accountByPhone.get(phone));
    const authMeta = (authUser as unknown as { user_metadata?: Record<string, unknown> } | undefined)?.user_metadata;
    const authName = String(authMeta?.full_name || authMeta?.name || authMeta?.businessName || authMeta?.business_name || "").trim();
    const key = email ? `email:${email}` : phone ? `phone:${phone}` : `id:${customer.id}`;
    customersByIdentity.set(key, {
      ...customer,
      id: authUser?.id || customer.id,
      full_name: String(customer.full_name || "").trim() || authName || null,
      email: customer.email || authUser?.email || null,
      phone: customer.phone || authUser?.phone || null,
      created_at: customer.created_at || authUser?.created_at,
      isAccount: Boolean(authUser) || accountUserIds.has(customer.id),
      marketingPartner: partnerByUserId.get(authUser?.id || customer.id) ?? null,
    });
  }
  // Include authenticated accounts even if their profile row was never created in public.customers.
  for (const user of authUsers) {
    const email = String(user.email || "").trim().toLowerCase();
    const phone = String(user.phone || "").replace(/\\D/g, "");
    const key = email ? `email:${email}` : phone ? `phone:${phone}` : `id:${user.id}`;
    const existing = customersByIdentity.get(key);
    if (existing) {
      const userMeta = (user as unknown as { user_metadata?: Record<string, unknown> }).user_metadata;
      const authName = String(userMeta?.full_name || userMeta?.name || userMeta?.businessName || userMeta?.business_name || "").trim();
      customersByIdentity.set(key, {
        ...existing,
        id: user.id,
        full_name: existing.full_name || authName || null,
        email: existing.email || user.email || null,
        phone: existing.phone || user.phone || null,
        created_at: existing.created_at || user.created_at,
        isAccount: true,
        marketingPartner: partnerByUserId.get(user.id) ?? existing.marketingPartner ?? null,
      });
      continue;
    }
    const userMeta = (user as unknown as { user_metadata?: Record<string, unknown> }).user_metadata;
    const fullName = String(userMeta?.full_name || userMeta?.name || userMeta?.display_name || userMeta?.businessName || userMeta?.business_name || "").trim();
    customersByIdentity.set(key, {
      id: user.id,
      full_name: fullName || null,
      email: user.email || null,
      phone: user.phone || String((user as unknown as { user_metadata?: Record<string, unknown> }).user_metadata?.phone || "").trim() || null,
      created_at: user.created_at,
      isAccount: true,
      marketingPartner: partnerByUserId.get(user.id) ?? null,
    });
  }
  const customers = Array.from(customersByIdentity.values()).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  return NextResponse.json({ customers });
}
