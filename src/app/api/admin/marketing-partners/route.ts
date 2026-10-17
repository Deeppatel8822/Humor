import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";


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
  const users: Array<{ id: string; email?: string; phone?: string; user_metadata?: Record<string, any>; app_metadata?: Record<string, any> }> = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return NextResponse.json({ error: "Could not load applications." }, { status: 500 });
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const applications = [];
  for (const user of users) {
    const marketingApplication = user.user_metadata?.marketing_partner_application;
    const businessProgramme = user.user_metadata?.business_programme;
    const isMarketingPending = marketingApplication?.status === "pending";
    const isBusinessPending = businessProgramme?.status === "pending_verification";
    if (!isMarketingPending && !isBusinessPending) continue;
    // If an account has both legacy and Business Programme applications, keep
    // the selected source and displayed fields aligned with the action target.
    const isBusinessProgramme = isBusinessPending;
    const application = isBusinessProgramme ? {
      status: "pending",
      businessType: businessProgramme.businessType,
      businessName: businessProgramme.businessName,
      gstPan: "",
      address: businessProgramme.address,
      mobile: businessProgramme.mobile,
      photoPaths: [],
      proofPath: businessProgramme.proofPath,
      termsAccepted: businessProgramme.termsAccepted,
      termsVersion: businessProgramme.termsVersion,
      termsAcceptedAt: businessProgramme.termsAcceptedAt,
      appliedAt: businessProgramme.registeredAt,
      registrationFeeInr: businessProgramme.registrationFeeInr,
    } : marketingApplication;
    const photoPaths = Array.isArray(application.photoPaths) ? application.photoPaths : [];
    const signed = photoPaths.length ? await admin.storage.from("vendor-business-photos").createSignedUrls(photoPaths, 3600) : { data: [] };
    let proofUrl: string | null = null;
    if (isBusinessPending && typeof businessProgramme.proofPath === "string") {
      const proof = await admin.storage.from("business-programme-proofs").createSignedUrl(businessProgramme.proofPath, 3600);
      proofUrl = proof.data?.signedUrl ?? null;
    }
    applications.push({ userId: user.id, email: user.email, phone: user.phone, application: { ...application, source: isBusinessPending ? "business_programme" : "marketing_partner", proofUrl, photoUrls: (signed.data || []).map((item) => item.signedUrl).filter(Boolean) }, partner: user.app_metadata?.marketing_partner });
  }
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

    const marketingApplication = data.user.user_metadata?.marketing_partner_application;
    const businessProgramme = data.user.user_metadata?.business_programme;
    const isBusinessProgramme = businessProgramme?.status === "pending_verification";
    const isMarketingPending = marketingApplication?.status === "pending";
    const application = isBusinessProgramme ? {
      businessName: businessProgramme.businessName,
      businessType: businessProgramme.businessType,
      address: businessProgramme.address,
      mobile: businessProgramme.mobile,
      proofPath: businessProgramme.proofPath,
      appliedAt: businessProgramme.registeredAt,
    } : isMarketingPending ? marketingApplication : null;
    if (!application) return NextResponse.json({ error: "Application is not pending." }, { status: 409 });

    if (action === "reject") {
      const nextUserMetadata = isBusinessProgramme
        ? { ...data.user.user_metadata, business_programme: { ...businessProgramme, status: "rejected", reviewedAt: new Date().toISOString() } }
        : { ...data.user.user_metadata, marketing_partner_application: { ...application, status: "rejected", reviewedAt: new Date().toISOString() } };
      const existingPartner = data.user.app_metadata?.marketing_partner;
      // Rejecting a Business Programme application must not revoke an existing
      // approved partner account or erase its wallet, code, tier and history.
      const nextPartner = isBusinessProgramme && existingPartner?.status === "approved"
        ? existingPartner
        : { ...(existingPartner && typeof existingPartner === "object" ? existingPartner : {}), status: "rejected" };
      const { error } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: nextUserMetadata,
        app_metadata: { ...data.user.app_metadata, marketing_partner: nextPartner },
      });
      if (error) throw error;
      return NextResponse.json({ success: true, status: "rejected" });
    }

    const existingPartner = data.user.app_metadata?.marketing_partner;
    // Generate a short, easy-to-share 6-character code and check it against
    // every existing partner code before assigning it.
    async function generateUniquePartnerCode() {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const allUsers: Array<{ app_metadata?: Record<string, any> }> = [];
      for (let page = 1; ; page += 1) {
        const { data: pageData, error: pageError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (pageError) throw pageError;
        allUsers.push(...pageData.users);
        if (pageData.users.length < 1000) break;
      }
      const used = new Set(allUsers.map((user) => String(user.app_metadata?.marketing_partner?.code || "").toUpperCase()).filter(Boolean));
      for (let attempt = 0; attempt < 100; attempt += 1) {
        let code = "";
        for (let index = 0; index < 6; index += 1) code += alphabet[crypto.randomInt(0, alphabet.length)];
        if (!used.has(code)) return code;
      }
      throw new Error("Could not generate a unique partner code. Please try again.");
    }
    const partner = isBusinessProgramme && existingPartner?.status === "approved"
      ? {
          ...existingPartner,
          status: "approved",
          businessName: application.businessName || existingPartner.businessName,
          address: application.address || existingPartner.address,
          mobile: application.mobile || existingPartner.mobile,
        }
      : {
          status: "approved",
          partnerId: "HLP" + crypto.randomBytes(6).toString("hex").toUpperCase(),
          code: await generateUniquePartnerCode(),
          usageCount: 0,
          walletBalance: 0,
          totalRewards: 0,
          totalSales: 0,
          referredCustomers: 0,
          businessName: application.businessName,
          gstPan: application.gstPan,
          address: application.address,
          mobile: application.mobile,
          photoPaths: application.photoPaths || [],
          appliedAt: application.appliedAt,
        };

    const nextUserMetadata = isBusinessProgramme
      ? { ...data.user.user_metadata, business_programme: { ...businessProgramme, status: "approved", reviewedAt: new Date().toISOString() } }
      : { ...data.user.user_metadata, marketing_partner_application: { ...application, status: "approved", reviewedAt: new Date().toISOString() } };
    const { error } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: nextUserMetadata,
      app_metadata: { ...data.user.app_metadata, marketing_partner: partner },
    });
    if (error) throw error;
    return NextResponse.json({ success: true, partner });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update application." }, { status: 400 });
  }
}
