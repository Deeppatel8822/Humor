import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { isWalletLedgerEnabled } from "@/lib/businessProgrammeWallet";

const COOKIE_NAME = "humor_admin";

function validAdmin(value: string | undefined) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!email || !value || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function authorized() {
  const cookieStore = await cookies();
  return validAdmin(cookieStore.get(COOKIE_NAME)?.value);
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWalletLedgerEnabled) {
    return NextResponse.json({ error: "Reward reversal requires BUSINESS_PROGRAMME_WALLET_LEDGER_ENABLED=true and the latest Supabase migration." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const orderNumber = String(body.order_number || "").trim();
    const refundReference = String(body.refund_reference || "").trim();
    if (!orderNumber || !refundReference || refundReference.length > 160) {
      return NextResponse.json({ error: "Order number and completed refund reference are required." }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, order_number, payment_status, razorpay_payment_id")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.payment_status === "refunded") {
      return NextResponse.json({ error: "This order is already marked refunded. Review its refund record before retrying." }, { status: 409 });
    }
    if (order.payment_status !== "paid" || !order.razorpay_payment_id) {
      return NextResponse.json({ error: "Only a paid Razorpay order can be marked refunded." }, { status: 409 });
    }

    // This records an already-completed provider refund; it does not issue one.
    const { data: reversal, error: reversalError } = await admin.rpc("business_programme_reward_reverse", {
      p_order_number: orderNumber,
      p_refund_reference: refundReference,
    });
    if (reversalError) throw reversalError;
    const result = reversal as {
      success?: boolean; error?: string; refundReference?: string; duplicate?: boolean;
      no_partner_reward?: boolean; balance?: number; reward?: number; unrecoveredAmount?: number;
      rewardTier?: string; qualificationCoins?: number; lifetimeRewards?: number; totalSales?: number;
      referredOrders?: number; couponUsageCount?: number;
    } | null;
    if (!result?.success) {
      if (result?.error === "REFUND_ALREADY_RECORDED") {
        return NextResponse.json({ error: "A reward reversal already exists for this order with a different refund reference." }, { status: 409 });
      }
      throw new Error(result?.error || "Reward reversal failed.");
    }

    const { error: orderUpdateError } = await admin
      .from("orders")
      .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("payment_status", "paid");
    if (orderUpdateError) throw orderUpdateError;

    if (result.balance !== undefined && !result.no_partner_reward) {
      const { data: authData, error: authError } = await admin.auth.admin.getUserById(
        String((await admin.from("business_programme_wallet_transactions")
          .select("partner_user_id")
          .eq("transaction_type", "reward")
          .eq("reference_id", "order:" + orderNumber)
          .maybeSingle()).data?.partner_user_id || "")
      );
      if (!authError && authData.user) {
        const current = authData.user.app_metadata?.marketing_partner;
        if (current && typeof current === "object") {
          const next = {
            ...(current as Record<string, unknown>),
            walletBalance: result.balance,
            rewardTier: result.rewardTier,
            qualificationCoins: result.qualificationCoins,
            totalRewards: result.lifetimeRewards,
            totalSales: result.totalSales,
            referredCustomers: result.referredOrders,
            usageCount: result.couponUsageCount,
          };
          const { error: metadataError } = await admin.auth.admin.updateUserById(authData.user.id, {
            app_metadata: { ...authData.user.app_metadata, marketing_partner: next },
          });
          if (metadataError) console.error("Partner metadata sync after refund reversal failed:", metadataError);
        }
      }
    }

    const unrecoveredAmount = Math.max(0, Number(result.unrecoveredAmount) || 0);
    return NextResponse.json({
      success: true,
      duplicate: Boolean(result.duplicate),
      orderNumber,
      paymentStatus: "refunded",
      rewardReversed: Math.max(0, Number(result.reward) || 0),
      unrecoveredAmount,
      warning: unrecoveredAmount > 0
        ? `Refund recorded. ₹${unrecoveredAmount.toLocaleString("en-IN")} of partner reward could not be recovered from the available wallet balance and needs manual review.`
        : undefined,
      message: result.no_partner_reward
        ? "Refund recorded. No canonical partner reward was linked to this order."
        : "Refund recorded and linked partner reward reversed.",
    });
  } catch (error) {
    console.error("Admin refund recording failed:", error);
    return NextResponse.json({ error: "Could not record refund and reverse the partner reward. Check the order and ledger before retrying." }, { status: 500 });
  }
}
