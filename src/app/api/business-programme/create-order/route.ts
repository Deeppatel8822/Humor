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
  let reservationId: string | null = null;
  let userId: string | null = null;

  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Please login or create your Humor account first." }, { status: 401 });
    userId = user.id;

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

    const admin = supabaseAdmin();
    const { data: proofFiles, error: proofError } = await admin
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

    // Reserve one active registration order per account before creating a provider order.
    const { data: reservation, error: reservationError } = await admin.rpc("business_programme_registration_order_reserve", {
      p_user_id: user.id,
    });
    if (reservationError) {
      // Keep registration available during staged rollout if the database migration
      // has not yet been applied. The reservation protection becomes active as soon
      // as the RPC exists in Supabase; this fallback preserves the previous flow only.
      const message = String(reservationError.message || "");
      const missingReservationRpc = reservationError.code === "PGRST202" ||
        /business_programme_registration_order_reserve.*(not found|schema cache)|could not find the function/i.test(message);
      if (!missingReservationRpc) throw reservationError;

      console.error("Business Programme order reservation migration is not applied yet; using legacy order creation.");
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
        reservationProtectionPending: true,
      });
    }
    if (!reservation?.success) {
      if (reservation?.conflict) {
        return NextResponse.json({ error: "Your Business Programme application is already submitted or awaiting verification." }, { status: 409 });
      }
      if (reservation?.busy) {
        return NextResponse.json({ error: "Your registration payment is being prepared. Please wait a minute and try again." }, { status: 409 });
      }
      throw new Error(reservation?.error || "Could not reserve a registration order.");
    }

    reservationId = String(reservation.reservationId || "");
    if (!reservationId) throw new Error("Registration order reservation did not return an ID.");

    if (reservation.duplicate === true && reservation.razorpayOrderId) {
      const existingOrder = await razorpayClient().orders.fetch(String(reservation.razorpayOrderId));
      if (
        Number(existingOrder.amount) !== REGISTRATION_FEE_INR * 100 ||
        existingOrder.currency !== "INR" ||
        String(existingOrder.notes?.userId || "") !== user.id ||
        String(existingOrder.notes?.programme || "") !== "humor_business"
      ) {
        throw new Error("Existing registration order failed ownership or amount validation.");
      }
      if (existingOrder.status === "paid") {
        return NextResponse.json({
          error: "A previous registration payment may already be complete. Do not pay again. Please contact Humor support to verify your application.",
        }, { status: 409 });
      }
      if (!["created", "attempted"].includes(String(existingOrder.status || ""))) {
        return NextResponse.json({
          error: "Your previous registration order cannot be reused. Please contact Humor support before making another payment.",
        }, { status: 409 });
      }

      return NextResponse.json({
        razorpayOrderId: existingOrder.id,
        amountInr: REGISTRATION_FEE_INR,
        keyId: process.env.RAZORPAY_KEY_ID,
        reused: true,
      });
    }

    const order = await razorpayClient().orders.create({
      amount: REGISTRATION_FEE_INR * 100,
      currency: "INR",
      receipt: "hb_" + Date.now(),
      notes: { userId: user.id, programme: "humor_business", businessName },
    });

    const { data: attached, error: attachError } = await admin.rpc("business_programme_registration_order_attach", {
      p_user_id: user.id,
      p_reservation_id: reservationId,
      p_razorpay_order_id: order.id,
    });
    if (attachError) throw attachError;
    if (!attached?.success) throw new Error("Could not safely attach the Razorpay order to the registration reservation.");

    return NextResponse.json({
      razorpayOrderId: order.id,
      amountInr: REGISTRATION_FEE_INR,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    if (reservationId && userId) {
      try {
        await supabaseAdmin().rpc("business_programme_registration_order_release", {
          p_user_id: userId,
          p_reservation_id: reservationId,
        });
      } catch (releaseError) {
        console.error("Could not release empty Business Programme registration reservation:", releaseError);
      }
    }
    console.error("Business programme payment order failed:", error);
    return NextResponse.json({ error: "Could not start the ₹9 payment. Please try again." }, { status: 500 });
  }
}
