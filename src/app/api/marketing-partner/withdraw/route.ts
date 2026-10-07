import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner, PARTNER_MIN_WITHDRAWAL } from "@/lib/marketingPartner";

export async function POST(request: Request) {
  try {
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please login first." }, { status: 401 });

    const admin = supabaseAdmin();
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const partner = getPartner(authData.user);
    const balance = Number(partner?.walletBalance ?? 0);
    if (!partner || partner.status !== "approved") return NextResponse.json({ error: "You are not an approved Marketing Partner." }, { status: 403 });
    if (balance < PARTNER_MIN_WITHDRAWAL) return NextResponse.json({ error: "Minimum withdrawal is ₹1,000." }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const amount = Math.min(balance, Math.max(PARTNER_MIN_WITHDRAWAL, Number(body.amount) || balance));
    const requests = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];
    const next = {
      ...partner,
      walletBalance: balance - amount,
      withdrawalRequests: [
        { amount, status: "withdrawal_requested", requestedAt: new Date().toISOString() },
        ...requests,
      ].slice(0, 100),
    };

    const { error } = await admin.auth.admin.updateUserById(authData.user.id, {
      app_metadata: { ...authData.user.app_metadata, marketing_partner: next },
    });
    if (error) throw error;

    return NextResponse.json({ success: true, partner: next });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create withdrawal request." }, { status: 400 });
  }
}
