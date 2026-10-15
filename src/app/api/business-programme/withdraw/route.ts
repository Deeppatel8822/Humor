import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner, PARTNER_MIN_WITHDRAWAL } from "@/lib/marketingPartner";
import { isWalletLedgerEnabled } from "@/lib/businessProgrammeWallet";

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

    let balance = Math.max(0, Number(partner.walletBalance || 0));
    let entries = Array.isArray(partner.withdrawalRequests) ? partner.withdrawalRequests : [];

    // Preserve legacy metadata-only duplicate protection when ledger mode is off.
    if (!isWalletLedgerEnabled) {
      const pendingRequest = entries.find((entry) => entry.status === "withdrawal:pending" && Number(entry.amount) === amount);
      if (pendingRequest) {
        return NextResponse.json({
          success: true,
          walletBalance: balance,
          message: "A withdrawal request for this amount is already pending review.",
          duplicate: true,
        });
      }
      if (amount > balance) return NextResponse.json({ error: "The requested amount is higher than your available balance." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const referenceId = `withdrawal:${data.user.id}:${now}`;
    let nextBalance = balance - amount;
    let reservedReferenceId = referenceId;
    let requestedAt = now;

    if (isWalletLedgerEnabled) {
      const { data: reservation, error: reservationError } = await admin.rpc("business_programme_withdrawal_reserve", {
        p_partner_user_id: data.user.id,
        p_amount_inr: amount,
        p_reference_id: referenceId,
        p_requested_at: now,
        p_description: "Partner withdrawal request",
      });
      if (reservationError) throw reservationError;
      const wallet = reservation as {
        success?: boolean;
        duplicate?: boolean;
        balance?: number;
        reference_id?: string;
        created_at?: string;
        error?: string;
      } | null;
      if (!wallet?.success) {
        if (wallet?.error === "INSUFFICIENT_BALANCE") {
          return NextResponse.json({ error: "The requested amount is higher than your available balance." }, { status: 400 });
        }
        throw new Error(wallet?.error || "Withdrawal reservation failed.");
      }
      balance = Number(wallet.balance ?? balance);
      nextBalance = balance;
      reservedReferenceId = wallet.reference_id || referenceId;
      requestedAt = wallet.created_at || now;
      if (wallet.duplicate) {
        const alreadyListed = entries.some((entry) =>
          (entry as typeof entry & { referenceId?: string }).referenceId === reservedReferenceId
        );
        const metadataBalance = Math.max(0, Number(partner.walletBalance || 0));
        if (!alreadyListed || metadataBalance !== balance) {
          const recoveredPartner = {
            ...partner,
            walletBalance: balance,
            withdrawalRequests: alreadyListed
              ? entries
              : [{
                  amount,
                  status: "withdrawal:pending",
                  requestedAt,
                  referenceId: reservedReferenceId,
                }, ...entries].slice(0, 100),
          };
          const { error: recoveryError } = await admin.auth.admin.updateUserById(data.user.id, {
            app_metadata: { ...latest.user.app_metadata, marketing_partner: recoveredPartner },
          });
          if (recoveryError) throw recoveryError;
        }
        return NextResponse.json({
          success: true,
          walletBalance: balance,
          message: "A withdrawal request for this amount is already pending review.",
          duplicate: true,
        });
      }
    }

    const next = {
      ...partner,
      walletBalance: nextBalance,
      withdrawalRequests: [{ amount, status: "withdrawal:pending", requestedAt, referenceId: reservedReferenceId }, ...entries].slice(0, 100),
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
