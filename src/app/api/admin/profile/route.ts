import { validAdminSession } from "@/lib/adminAuth";
import { NextRequest, NextResponse } from "next/server";

function isAuthenticated(request: NextRequest) { return validAdminSession(request.cookies.get("humor_admin")?.value); }

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
