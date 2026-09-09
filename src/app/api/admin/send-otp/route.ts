import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { adminEmail, adminMobile, generateOtp, isAdminIdentifier, normalizeIdentifier, otpHash, OTP_TTL_MS, ADMIN_OTP_COOKIE } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    const input = normalizeIdentifier(String(identifier || ""));
    if (!input || !isAdminIdentifier(input)) {
      return NextResponse.json({ error: "This email or mobile is not registered for admin access." }, { status: 401 });
    }

    const hasEmailProvider = Boolean(process.env.RESEND_API_KEY && process.env.OTP_FROM_EMAIL);
    const hasSmsProvider = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
    if (!hasEmailProvider || !hasSmsProvider) {
      return NextResponse.json({ error: "OTP delivery is not configured yet. Add the email and SMS provider variables in Netlify." }, { status: 503 });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;
    const db = supabaseAdmin();
    await db.from("admin_otps").update({ consumed_at: new Date().toISOString() }).eq("identifier", input).is("consumed_at", null);
    const { error } = await db.from("admin_otps").insert({ identifier: input, otp_hash: otpHash(input, otp, expiresAt), expires_at: new Date(expiresAt).toISOString() });
    if (error) throw new Error(error.message);

    // Delivery adapters are intentionally enabled only after provider variables are configured.
    // The same generated OTP must be sent to adminEmail() and adminMobile().
    void otp; void adminEmail(); void adminMobile();
    return NextResponse.json({ error: "OTP provider adapter is ready for configuration." }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start OTP login." }, { status: 500 });
  }
}
