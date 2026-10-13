import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner } from "@/lib/marketingPartner";
import { isWalletLedgerEnabled, postWalletTransaction } from "@/lib/businessProgrammeWallet";

async function getAdmin(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user?.email) return null;
  const allowed = (process.env.BUSINESS_PROGRAMME_ADMIN_EMAILS || "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(data.user.email.toLowerCase())) return null;
  return { admin, user: data.user };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdmin(req);
    if (!auth) return NextResponse.json({ error: "Admin access is not configured or you are not authorised." }, { status: 403 });
    const { data, error } = await auth.admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    const requests = data.users.flatMap((user) => {
      const partner = getPartner(user);
      if (!partner) return [];
      return (Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [])
        .filter((entry) => entry.status === "withdrawal:pending")
        .map((entry) => ({
          userId: user.id,
          email: user.email || "",
          name: partner.businessName || user.user_metadata?.full_name || user.user_metadata?.name || "Partner",
          mobile: partner.mobile || "",
          amount: Number(entry.amount) || 0,
          requestedAt: entry.requestedAt,
          walletBalance: Number(partner.walletBalance) || 0,
          status: entry.status,
        }));
    });
    requests.sort((a, b) => String(a.requestedAt).localeCompare(String(b.requestedAt)));
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Could not load withdrawal requests." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAdmin(req);
    if (!auth) return NextResponse.json({ error: "Admin access is not configured or you are not authorised." }, { status: 403 });
    const body = await req.json();
    const userId = String(body.userId || "");
    const requestedAt = String(body.requestedAt || "");
    const decision = String(body.decision || "");
    if (!userId || !requestedAt || !["approve", "reject"].includes(decision)) {
      return NextResponse.json({ error: "Invalid withdrawal decision." }, { status: 400 });
    }

    const { data, error } = await auth.admin.auth.admin.getUserById(userId);
    if (error || !data.user) return NextResponse.json({ error: "Partner account not found." }, { status: 404 });
    const partner = getPartner(data.user);
    if (!partner) return NextResponse.json({ error: "Partner account not found." }, { status: 404 });
    const entries = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];
    const index = entries.findIndex((entry) => entry.status === "withdrawal:pending" && entry.requestedAt === requestedAt);
    if (index < 0) return NextResponse.json({ error: "This request was already handled or could not be found." }, { status: 409 });

    const request = entries[index];
    const requestReferenceId = (request as unknown as { referenceId?: unknown }).referenceId;
    const referenceId = typeof requestReferenceId === "string"
      ? requestReferenceId
      : `withdrawal:${userId}:${requestedAt}`;
    let nextBalance = Math.max(0, Number(partner.walletBalance || 0)) +
      (decision === "reject" ? Math.max(0, Number(request.amount || 0)) : 0);
    if (isWalletLedgerEnabled) {
      const wallet = await postWalletTransaction({
        partnerUserId: userId,
        type: decision === "approve" ? "withdrawal_paid" : "withdrawal_rejected",
        amountInr: Number(request.amount || 0),
        referenceId,
        description: decision === "approve" ? "Withdrawal approved for payout" : "Withdrawal rejected; reserved funds returned",
        metadata: { requestedAt, decision },
      });
      nextBalance = Number(wallet.balance ?? nextBalance);
    }
    const nextEntries = [...entries];
    nextEntries[index] = { ...request, status: decision === "approve" ? "withdrawal:approved" : "withdrawal:rejected" };
    const nextPartner = {
      ...partner,
      walletBalance: nextBalance,
      withdrawalRequests: nextEntries,
    };
    const { error: updateError } = await auth.admin.auth.admin.updateUserById(userId, {
      app_metadata: { ...data.user.app_metadata, marketing_partner: nextPartner },
    });
    if (updateError) throw updateError;
    return NextResponse.json({ success: true, message: decision === "approve" ? "Withdrawal marked approved. Complete the bank transfer and record the payout reference separately." : "Withdrawal rejected and reserved balance returned to the partner." });
  } catch {
    return NextResponse.json({ error: "Could not process this withdrawal decision." }, { status: 500 });
  }
}
