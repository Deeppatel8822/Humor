import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_OTP_COOKIE,
  SESSION_TTL_SECONDS,
  adminOtpSecret,
  checkAdminOtpRateLimit,
  isAdminIdentifier,
  normalizeIdentifier,
  sessionToken,
} from "@/lib/adminAuth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { otp } = await request.json();
    const entered = String(otp || "").trim();
    const cookieStore = await cookies();
    const raw = cookieStore.get(ADMIN_OTP_COOKIE)?.value || "";

    // Email identifiers may contain dots, so split only on the final two separators.
    const lastDot = raw.lastIndexOf(".");
    const previousDot = raw.lastIndexOf(".", lastDot - 1);
    const identifier = previousDot >= 0 ? raw.slice(0, previousDot) : "";
    const expires = previousDot >= 0 ? raw.slice(previousDot + 1, lastDot) : "";
    const hash = lastDot >= 0 ? raw.slice(lastDot + 1) : "";
    const expiresAt = Number(expires);

    if (!identifier || !expiresAt || !hash || Date.now() > expiresAt || !isAdminIdentifier(identifier)) {
      return NextResponse.json({ error: "OTP is invalid or expired." }, { status: 401 });
    }

    const rate = await checkAdminOtpRateLimit(request, identifier, "verify");
    if (!rate.allowed) {
      return NextResponse.json(
        { error: rate.unavailable ? "Admin login is temporarily unavailable. Please try again shortly." : "Too many incorrect OTP attempts. Please request a new code later." },
        { status: rate.unavailable ? 503 : 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    if (!/^\d{6}$/.test(entered)) {
      return NextResponse.json({ error: "OTP is invalid or expired." }, { status: 401 });
    }

    const expected = crypto.createHmac("sha256", adminOtpSecret())
      .update(`${normalizeIdentifier(identifier)}:${entered}:${expiresAt}`)
      .digest("hex");
    if (hash.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) {
      return NextResponse.json({ error: "Incorrect OTP." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, sessionToken(identifier), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    response.cookies.set(ADMIN_OTP_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
