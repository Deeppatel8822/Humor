import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "humor_admin";

function tokenFor(email: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret).update(email).digest("hex");
}

function isAuthenticated(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
  return Boolean(cookie && email && cookie === tokenFor(email));
}

function maskMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 5) return "••••";
  return `${digits.slice(0, 2)}••••${digits.slice(-2)}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || "",
    mobile: maskMobile(process.env.ADMIN_MOBILE || ""),
    sessionHours: 24,
    otpLogin: true,
  });
}
