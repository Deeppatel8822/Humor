import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { razorpayClient } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Please login first." }, { status: 401 });

    const admin = supabaseAdmin();
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Your login session has expired. Please login again." }, { status: 401 });

    const body = await req.json();
    const razorpayOrderId = String(body.razorpay_order_id || "");
    const razorpayPaymentId = String(body.razorpay_payment_id || "");
    const razorpaySignature = String(body.razorpay_signature || "");
    const registration = body.registration || {};

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Payment details are incomplete." }, { status: 400 });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (expected !== razorpaySignature) {
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const razorpayOrder = await razorpayClient().orders.fetch(razorpayOrderId);
    if (Number(razorpayOrder.amount) !== 900 || razorpayOrder.currency !== "INR") {
      return NextResponse.json({ error: "Invalid registration payment amount." }, { status: 400 });
    }

    const businessType = String(registration.businessType || "").trim();
    const businessName = String(registration.businessName || "").trim();
    const mobile = String(registration.mobile || "").trim();
    const address = String(registration.address || "").trim();
    const proofPath = String(registration.proofPath || "").trim();

    if (!businessType || !businessName || !mobile || !address || !proofPath || !proofPath.startsWith(authData.user.id + "/")) {
      return NextResponse.json({ error: "Registration details are incomplete." }, { status: 400 });
    }

    const programme = {
      status: "active",
      businessType,
      businessName,
      mobile,
      address,
      proofPath,
      registrationFeeInr: 9,
      razorpayOrderId,
      razorpayPaymentId,
      registeredAt: new Date().toISOString(),
    };

    const { error } = await admin.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        ...authData.user.user_metadata,
        business_programme: programme,
      },
    });
    if (error) throw error;

    return NextResponse.json({ success: true, programme });
  } catch (error) {
    console.error("Business programme payment verification failed:", error);
    return NextResponse.json({ error: "Could not complete registration after payment. Please contact Humor support." }, { status: 500 });
  }
}
