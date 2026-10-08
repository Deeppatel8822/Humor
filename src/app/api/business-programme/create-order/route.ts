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

    if (!businessType || !businessName || !mobile || !address || !proofPath) {
      return NextResponse.json({ error: "Please complete all registration details and upload business proof." }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });

    const existing = user.user_metadata?.business_programme;
    if (existing?.status === "active") return NextResponse.json({ error: "Your business programme is already active." }, { status: 409 });

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
