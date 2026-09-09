import { NextResponse } from "next/server";
import { ADMIN_OTP_COOKIE, OTP_TTL_MS, generateOtp, isAdminIdentifier, normalizeIdentifier, otpHash } from "@/lib/adminAuth";

function emailRecipient() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
}

async function sendOtpEmail(otp: string, expiresAt: number) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = emailRecipient();
  const from = process.env.RESEND_FROM_EMAIL || "Humor Luxury <onboarding@resend.dev>";
  if (!apiKey || !to) throw new Error("Email OTP is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Humor Luxury Admin Login OTP",
      text: `Your Humor Luxury admin login OTP is ${otp}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2 style="color:#3e1730">Humor Luxury Admin</h2><p>Your one-time login code is:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:20px 0">${otp}</div><p>This OTP expires in 10 minutes.</p><p style="color:#666;font-size:13px">If you did not request this code, you can safely ignore this email.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error("Could not send OTP email.");
  return response;
}

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    const value = String(identifier || "").trim();
    if (!isAdminIdentifier(value)) {
      return NextResponse.json({ error: "This email or mobile number is not registered as an admin." }, { status: 401 });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;
    await sendOtpEmail(otp, expiresAt);

    const token = `${normalizeIdentifier(value)}.${expiresAt}.${otpHash(value, otp, expiresAt)}`;
    const response = NextResponse.json({ success: true, expiresAt, destination: "email" });
    response.cookies.set(ADMIN_OTP_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    console.error("Admin OTP request error:", error);
    return NextResponse.json({ error: "Could not send the OTP. Check the Resend configuration." }, { status: 500 });
  }
}
