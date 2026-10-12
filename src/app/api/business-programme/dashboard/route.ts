import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner } from "@/lib/marketingPartner";

export async function GET(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please log in to view your partner dashboard." }, { status: 401 });

    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });

    const partner = getPartner(data.user);
    if (!partner) return NextResponse.json({ error: "No business programme application was found for this account." }, { status: 404 });

    const entries = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];
    const history = entries.slice(0, 100).map((entry) => ({
      amount: Number(entry.amount) || 0,
      status: String(entry.status || "recorded"),
      requestedAt: entry.requestedAt || null,
      kind: String(entry.status || "").startsWith("reward:") ? "reward" : "withdrawal",
    }));

    return NextResponse.json({
      status: partner.status,
      userId: data.user.id,
      code: partner.code || null,
      rewardTier: partner.rewardTier || "basic",
      rewardRate: partner.rewardTier === "gold" ? 30 : partner.rewardTier === "silver" ? 27 : 25,
      walletBalance: Math.max(0, Number(partner.walletBalance || 0)),
      lifetimeCoins: Math.max(0, Number(partner.totalRewards || 0)),
      qualificationCoins: Math.max(0, Number(partner.qualificationCoins || 0)),
      qualificationPeriodStartedAt: partner.qualificationPeriodStartedAt || null,
      totalSales: Math.max(0, Number(partner.totalSales || 0)),
      referredCustomers: Math.max(0, Number(partner.referredCustomers || 0)),
      history,
    });
  } catch {
    return NextResponse.json({ error: "Could not load your partner dashboard right now." }, { status: 500 });
  }
}
