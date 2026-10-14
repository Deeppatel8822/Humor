import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { razorpayClient } from "@/lib/razorpay";

const REGISTRATION_FEE_INR = 9;

async function getUser(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  return error || !data.user ? null : data.user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Please login or create your Humor account first." }, { status: 401 });

    const body = await req.json();
    const businessType = String(body.businessType || "").trim();
    const businessName = String(body.businessName || "").trim();
    const mobile = String(body.mobile || "").trim();
    const address = String(body.address || "").trim();
    const proofPath = String(body.proofPath || "").trim();
    const registration = body.registration && typeof body.registration === "object" ? body.registration : {};
    const termsAccepted = body.termsAccepted === true || registration.termsAccepted === true;
    const termsVersion = String(body.termsVersion || registration.termsVersion || "").trim();

    if (!businessType || !businessName || !mobile || !address || !proofPath) {
      return NextResponse.json({ error: "Please complete all registration details and upload business proof." }, { status: 400 });
    }
    const proofPathParts = proofPath.split("/");
    const allowedBusinessTypes = [
      "Influencer / Content Creator",
      "Salon / Parlour",
      "Beauty Professional",
      "Home Beauty Business",
      "Beauty Store / Retailer",
      "Other",
    ];
    if (!allowedBusinessTypes.includes(businessType)) {
      return NextResponse.json({ error: "Please select a valid business type." }, { status: 400 });
    }
    if (
      proofPathParts.length !== 2 ||
      proofPathParts[0] !== user.id ||
      proofPathParts.some((part) => !part || part === "." || part === "..")
    ) {
      return NextResponse.json({ error: "Please upload business proof to your own application folder using a valid path." }, { status: 400 });
    }
    const { data: proofFiles, error: proofError } = await supabaseAdmin()
      .storage.from("business-programme-proofs")
      .list(user.id, { limit: 100, search: proofPathParts[1] });
    if (proofError) throw proofError;
    if (!(proofFiles || []).some((file) => file.name === proofPathParts[1])) {
      return NextResponse.json({ error: "Your business proof could not be found. Please upload it again." }, { status: 400 });
    }
    if (!termsAccepted || termsVersion !== "2026-10-12-v1") {
      return NextResponse.json({ error: "Please accept the current Business Programme terms before payment." }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });

    const existing = user.user_metadata?.business_programme;
    if (existing?.status === "pending_verification" || existing?.status === "approved") {
      return NextResponse.json({ error: "Your application is already submitted and is awaiting or has completed verification." }, { status: 409 });
    }

    const order = await razorpayClient().orders.create({
      amount: REGISTRATION_FEE_INR * 100,
      currency: "INR",
      receipt: "hb_" + Date.now(),
      notes: { userId: user.id, programme: "humor_business", businessName },
    });

    return NextResponse.json({
      razorpayOrderId: order.id,
      amountInr: REGISTRATION_FEE_INR,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Business programme payment order failed:", error);
    return NextResponse.json({ error: "Could not start the ₹9 payment. Please try again." }, { status: 500 });
  }
}
