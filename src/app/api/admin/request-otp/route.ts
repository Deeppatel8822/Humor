import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_OTP_COOKIE, OTP_TTL_MS, generateOtp, isAdminIdentifier, normalizeIdentifier, otpHash } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    const value = String(identifier || "").trim();
    if (!isAdminIdentifier(value)) return NextResponse.json({ error: "This email or mobile number is not registered as an admin." }, { status: 401 });

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;
    const token = `${normalizeIdentifier(value)}.${expiresAt}.${otpHash(value, otp, expiresAt)}`;
    const response = NextResponse.json({ success: true, expiresAt, developmentOtp: process.env.NODE_ENV === "development" ? otp : undefined });
    response.cookies.set(ADMIN_OTP_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 10 * 60 });

    // Delivery is intentionally isolated behind provider configuration.
    // Configure EMAIL/SMS/WhatsApp providers before production use.
    console.log(`Humor admin OTP generated for ${normalizeIdentifier(value)}: ${otp}`);
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
