import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { PARTNER_CODE_VALIDITY_DAYS, PARTNER_USAGE_LIMIT } from "@/lib/marketingPartner";

async function authorized() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const cookieStore = await cookies();
  const value = cookieStore.get("humor_admin")?.value;
  if (!email || !value || !secret) return false;
  return value === crypto.createHmac("sha256", secret).update(email).digest("hex");
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: "Could not load applications." }, { status: 500 });
  const applications = data.users
    .map((user) => ({ userId: user.id, email: user.email, phone: user.phone, application: user.user_metadata?.marketing_partner_application, partner: user.app_metadata?.marketing_partner }))
    .filter((item) => item.application?.status === "pending");
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const userId = String(body.userId || "");
    const action = String(body.action || "");
    if (!userId || !["approve","reject"].includes(action)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

    const admin = supabaseAdmin();
    const { data, error: userError } = await admin.auth.admin.getUserById(userId);
    if (userError || !data.user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const application = data.user.user_metadata?.marketing_partner_application;
    if (!application || application.status !== "pending") return NextResponse.json({ error: "Application is not pending." }, { status: 409 });

    if (action === "reject") {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: { ...data.user.user_metadata, marketing_partner_application: { ...application, status: "rejected", reviewedAt: new Date().toISOString() } },
        app_metadata: { ...data.user.app_metadata, marketing_partner: { status: "rejected" } },
      });
      if (error) throw error;
      return NextResponse.json({ success: true, status: "rejected" });
    }

    const code = "HUMOR-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + PARTNER_CODE_VALIDITY_DAYS * 86400000).toISOString();
    const partner = {
      status: "approved",
      code,
      expiresAt,
      usageCount: 0,
      usageLimit: PARTNER_USAGE_LIMIT,
      walletBalance: 0,
      totalRewards: 0,
      totalSales: 0,
      referredCustomers: 0,
      businessName: application.businessName,
      gstPan: application.gstPan,
      address: application.address,
      mobile: application.mobile,
      photoNames: application.photoNames || [],
      appliedAt: application.appliedAt,
    };

    const { error } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...data.user.user_metadata, marketing_partner_application: { ...application, status: "approved", reviewedAt: new Date().toISOString() } },
      app_metadata: { ...data.user.app_metadata, marketing_partner: partner },
    });
    if (error) throw error;
    return NextResponse.json({ success: true, partner });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update application." }, { status: 400 });
  }
}
