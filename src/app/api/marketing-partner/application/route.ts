import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner } from "@/lib/marketingPartner";

async function getUser(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Please login first." }, { status: 401 });
  return NextResponse.json({
    partner: getPartner(user),
    application: user.user_metadata?.marketing_partner_application ?? null,
  });
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Please login first." }, { status: 401 });

    const body = await request.json();
    const businessName = String(body.businessName || "").trim();
    const gstPan = String(body.gstPan || "").trim().toUpperCase();
    const address = String(body.address || "").trim();
    const mobile = String(body.mobile || "").trim();
    const photoNames = Array.isArray(body.photoNames) ? body.photoNames.map((x: unknown) => String(x)).slice(0, 3) : [];

    if (!businessName || !gstPan || !address || !mobile || photoNames.length !== 3) {
      return NextResponse.json({ error: "Please complete all details and select 3 business photos." }, { status: 400 });
    }

    const current = getPartner(user);
    if (current?.status === "approved") {
      return NextResponse.json({ error: "You are already an approved Marketing Partner." }, { status: 409 });
    }
    if (current?.status === "pending") {
      return NextResponse.json({ error: "Your Marketing Partner application is already under review." }, { status: 409 });
    }

    const admin = supabaseAdmin();
    const application = {
      status: "pending",
      businessName,
      gstPan,
      address,
      mobile,
      photoNames,
      appliedAt: new Date().toISOString(),
    };

    const { error } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        marketing_partner_application: application,
      },
    });
    if (error) throw error;

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Marketing partner application error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit application." }, { status: 400 });
  }
}
