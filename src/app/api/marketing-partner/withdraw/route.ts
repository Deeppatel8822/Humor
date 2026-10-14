import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner, PARTNER_MIN_WITHDRAWAL } from "@/lib/marketingPartner";
import { isWalletLedgerEnabled } from "@/lib/businessProgrammeWallet";

export async function POST(request: Request) {
  try {
    const header = request.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please login first." }, { status: 401 });

    const admin = supabaseAdmin();
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const { data: latest, error: latestError } = await admin.auth.admin.getUserById(authData.user.id);
    if (latestError || !latest.user) return NextResponse.json({ error: "Could not load your partner account." }, { status: 500 });

    const partner = getPartner(latest.user);
    if (!partner || partner.status !== "approved") {
      return NextResponse.json({ error: "You are not an approved Marketing Partner." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const balance = Math.max(0, Number(partner.walletBalance ?? 0));
    const amount = Math.floor(Number(body.amount ?? balance));
    if (!Number.isFinite(amount) || amount < PARTNER_MIN_WITHDRAWAL) {
      return NextResponse.json({ error: "Minimum withdrawal is ₹1,000." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const referenceId = `withdrawal:${authData.user.id}:${now}`;
    let nextBalance = balance;
    let reservedReferenceId = referenceId;
    let requestedAt = now;
    const requests = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];

    if (isWalletLedgerEnabled) {
      const { data: reservation, error: reservationError } = await admin.rpc("business_programme_withdrawal_reserve", {
        p_partner_user_id: authData.user.id,
        p_amount_inr: amount,
        p_reference_id: referenceId,
        p_requested_at: now,
        p_description: "Marketing Partner withdrawal request",
      });
      if (reservationError) throw reservationError;
      const result = reservation as {
        success?: boolean; duplicate?: boolean; balance?: number;
        reference_id?: string; created_at?: string; error?: string;
      } | null;
      if (!result?.success) {
        if (result?.error === "INSUFFICIENT_BALANCE") {
          return NextResponse.json({ error: "The requested amount is higher than your available balance." }, { status: 400 });
        }
        throw new Error(result?.error || "Withdrawal reservation failed.");
      }
      nextBalance = Number(result.balance ?? balance);
      reservedReferenceId = result.reference_id || referenceId;
      requestedAt = result.created_at || now;
      if (result.duplicate) {
        return NextResponse.json({
          success: true,
          walletBalance: nextBalance,
          message: "A withdrawal request for this amount is already pending review.",
          duplicate: true,
        });
      }
    } else {
      if (amount > balance) {
        return NextResponse.json({ error: "The requested amount is higher than your available balance." }, { status: 400 });
      }
      const pending = requests.find((entry) =>
        entry.status === "withdrawal:pending" && Number(entry.amount) === amount
      );
      if (pending) {
        return NextResponse.json({
          success: true,
          walletBalance: balance,
          message: "A withdrawal request for this amount is already pending review.",
          duplicate: true,
        });
      }
      nextBalance = balance - amount;
    }

    const next = {
      ...partner,
      walletBalance: nextBalance,
      withdrawalRequests: [{
        amount,
        status: "withdrawal:pending",
        requestedAt,
        referenceId: reservedReferenceId,
      }, ...requests].slice(0, 100),
    };

    const { error } = await admin.auth.admin.updateUserById(authAuthUserId(authData.user.id), {
      app_metadata: { ...latest.user.app_metadata, marketing_partner: next },
    });
    if (error) throw error;

    return NextResponse.json({ success: true, partner: next, walletBalance: nextBalance });
  } catch (error) {
    console.error("Marketing partner withdrawal request failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create withdrawal request." }, { status: 400 });
  }
}

function authAuthUserId(userId: string) {
  return userId;
}
