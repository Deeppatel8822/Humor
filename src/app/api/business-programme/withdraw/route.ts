import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner, PARTNER_MIN_WITHDRAWAL } from "@/lib/marketingPartner";

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const amount = Math.floor(Number(body.amount));
    if (!Number.isFinite(amount) || amount < PARTNER_MIN_WITHDRAWAL) {
      return NextResponse.json({ error: "The minimum withdrawal request is ₹1,000." }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });

    const { data: latest, error: latestError } = await admin.auth.admin.getUserById(data.user.id);
    if (latestError || !latest.user) return NextResponse.json({ error: "Could not load your partner account." }, { status: 500 });
    const partner = getPartner(latest.user);
    if (!partner || partner.status !== "approved" || !partner.code) {
      return NextResponse.json({ error: "Only approved partners can request withdrawals." }, { status: 403 });
    }

    const balance = Math.max(0, Number(partner.walletBalance || 0));
    if (amount > balance) return NextResponse.json({ error: "The requested amount is higher than your available balance." }, { status: 400 });

    const entries = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];
    const now = new Date().toISOString();
    const next = {
      ...partner,
      walletBalance: balance - amount,
      withdrawalRequests: [{ amount, status: "withdrawal:pending", requestedAt: now }, ...entries].slice(0, 100),
    };
    const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { ...latest.user.app_metadata, marketing_partner: next },
    });
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, walletBalance: next.walletBalance, message: "Withdrawal request submitted for review." });
  } catch {
    return NextResponse.json({ error: "Could not submit your withdrawal request right now." }, { status: 500 });
  }
}
