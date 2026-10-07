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

  const customers = (data ?? []).map((customer) => ({
    ...customer,
    marketingPartner: partnerByUserId.get(customer.id) ?? null,
  }));
  return NextResponse.json({ customers });
}
