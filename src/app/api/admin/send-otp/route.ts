import { NextResponse } from "next/server";

// Retired incomplete endpoint. The active admin login uses the
// rate-limited /api/admin/request-otp and /api/admin/verify-otp flow.
export async function POST() {
  return NextResponse.json(
    { error: "This OTP endpoint has been retired. Please use the current admin login page." },
    { status: 410 },
  );
}
