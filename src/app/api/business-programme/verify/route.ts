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
    const registration = body.registration && typeof body.registration === "object" ? body.registration : {};

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Payment details are incomplete." }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Payment verification is temporarily unavailable." }, { status: 503 });
    }
    const expected = crypto
      .createHmac("sha256", secret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    const suppliedBuffer = Buffer.from(razorpaySignature, "hex");
    if (
      !/^[a-f0-9]{64}$/i.test(razorpaySignature) ||
      expectedBuffer.length !== suppliedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
    }

    const client = razorpayClient();
    const razorpayOrder = await client.orders.fetch(razorpayOrderId);
    if (
      Number(razorpayOrder.amount) !== 900 ||
      razorpayOrder.currency !== "INR" ||
      String(razorpayOrder.notes?.userId || "") !== authData.user.id ||
      String(razorpayOrder.notes?.programme || "") !== "humor_business"
    ) {
      return NextResponse.json({ error: "This payment order is not valid for your Business Programme registration." }, { status: 400 });
    }

    const payment = await client.payments.fetch(razorpayPaymentId);
    if (
      String(payment.order_id || "") !== razorpayOrderId ||
      Number(payment.amount) !== 900 ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return NextResponse.json({ error: "Payment is not captured or does not match this registration order." }, { status: 400 });
    }

    const existingProgramme = authData.user.user_metadata?.business_programme;
    if (
      existingProgramme &&
      ["pending_verification", "approved"].includes(String(existingProgramme.status || "")) &&
      String(existingProgramme.razorpayPaymentId || "") === razorpayPaymentId &&
      String(existingProgramme.razorpayOrderId || "") === razorpayOrderId
    ) {
      return NextResponse.json({ success: true, duplicate: true, programme: existingProgramme });
    }
    if (existingProgramme && ["pending_verification", "approved"].includes(String(existingProgramme.status || ""))) {
      return NextResponse.json({ error: "A Business Programme application is already submitted for this account." }, { status: 409 });
    }

    // Accept both supported request shapes: top-level fields and a nested registration object.
    const businessType = String(registration.businessType || body.businessType || "").trim();
    const businessName = String(registration.businessName || body.businessName || "").trim();
    const mobile = String(registration.mobile || body.mobile || "").trim();
    const address = String(registration.address || body.address || "").trim();
    const proofPath = String(registration.proofPath || body.proofPath || "").trim();
    const termsAccepted = registration.termsAccepted === true || body.termsAccepted === true;
    const termsVersion = String(registration.termsVersion || body.termsVersion || "").trim();

    const proofPathParts = proofPath.split("/");
    if (
      !businessType || !businessName || !mobile || !address || !proofPath ||
      !proofPath.startsWith(authData.user.id + "/") ||
      proofPathParts.some((part: string) => !part || part === "." || part === "..") ||
      !/^\d{10}$/.test(mobile) ||
      !termsAccepted || !termsVersion
    ) {
      return NextResponse.json({ error: "Registration details are incomplete or invalid." }, { status: 400 });
    }

    const programme = {
      status: "pending_verification",
      businessType,
      businessName,
      mobile,
      address,
      proofPath,
      registrationFeeInr: 9,
      razorpayOrderId,
      razorpayPaymentId,
      termsAccepted: true,
      termsVersion,
      termsAcceptedAt: new Date().toISOString(),
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
