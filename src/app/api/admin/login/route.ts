import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_OTP_COOKIE, SESSION_TTL_SECONDS, adminOtpSecret, generateOtp, isAdminIdentifier, normalizeIdentifier, otpHash, sessionToken } from "@/lib/adminAuth";
import { cookies } from "next/headers";

async function sendOtpEmail(otp: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
  const from = process.env.RESEND_FROM_EMAIL || "Humor Luxury <onboarding@resend.dev>";
  if (!apiKey || !to) throw new Error("Email OTP is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Humor Luxury Admin Login OTP",
      text: `Your Humor Luxury admin login OTP is ${otp}. It expires in 10 minutes.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2 style="color:#3e1730">Humor Luxury Admin</h2><p>Your one-time login code is:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:20px 0">${otp}</div><p>This OTP expires in 10 minutes.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error("Could not send OTP email.");
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const identifier = String(email || "").trim();
    const entered = String(password || "").trim();
    if (!isAdminIdentifier(identifier)) {
      return NextResponse.json({ error: "This email or mobile number is not registered as an admin." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const pending = cookieStore.get(ADMIN_OTP_COOKIE)?.value || "";

    // The existing admin screen uses its second field for the OTP. On the
    // first submit, send the OTP and ask the user to enter the six-digit code.
    if (!/^\d{6}$/.test(entered)) {
      const otp = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      await sendOtpEmail(otp);
      const token = `${normalizeIdentifier(identifier)}.${expiresAt}.${otpHash(identifier, otp, expiresAt)}`;
      const response = NextResponse.json({ error: "OTP sent to your registered email. Enter the 6-digit OTP in the password field." }, { status: 401 });
      response.cookies.set(ADMIN_OTP_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 10 * 60 });
      return response;
    }

    const [pendingIdentifier, expires, hash] = pending.split(".");
    const expiresAt = Number(expires);
    if (!pendingIdentifier || !expiresAt || !hash || Date.now() > expiresAt || normalizeIdentifier(identifier) !== pendingIdentifier) {
      return NextResponse.json({ error: "OTP is expired. Submit again to receive a new OTP." }, { status: 401 });
    }
    const expected = otpHash(identifier, entered, expiresAt);
    if (hash.length !== expected.length || !require("crypto").timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) {
      return NextResponse.json({ error: "Incorrect OTP." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, sessionToken(identifier), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_SECONDS });
    response.cookies.set(ADMIN_OTP_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Could not process admin login. Check OTP configuration." }, { status: 500 });
  }
}
