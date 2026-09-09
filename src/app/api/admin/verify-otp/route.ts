import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, ADMIN_OTP_COOKIE, SESSION_TTL_SECONDS, adminOtpSecret, normalizeIdentifier, sessionToken } from "@/lib/adminAuth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { otp } = await request.json();
    const entered = String(otp || "").trim();
    const cookieStore = await cookies();
    const raw = cookieStore.get(ADMIN_OTP_COOKIE)?.value || "";
    const [identifier, expires, hash] = raw.split(".");
    const expiresAt = Number(expires);
    if (!identifier || !expiresAt || !hash || Date.now() > expiresAt || !/^\d{6}$/.test(entered)) return NextResponse.json({ error: "OTP is invalid or expired." }, { status: 401 });
    const expected = crypto.createHmac("sha256", adminOtpSecret()).update(`${normalizeIdentifier(identifier)}:${entered}:${expiresAt}`).digest("hex");
    if (hash.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) return NextResponse.json({ error: "Incorrect OTP." }, { status: 401 });

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, sessionToken(identifier), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_SECONDS });
    response.cookies.set(ADMIN_OTP_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
