import crypto from "crypto";

export const ADMIN_COOKIE = "humor_admin";
export const ADMIN_OTP_COOKIE = "humor_admin_otp";
export const OTP_TTL_MS = 10 * 60 * 1000;
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

export function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
}

export function adminMobile() {
  return (process.env.ADMIN_MOBILE || "").replace(/\D/g, "");
}

export function isAdminIdentifier(value: string) {
  const v = normalizeIdentifier(value);
  const mobile = v.replace(/\D/g, "");
  return Boolean(v) && (v === adminEmail() || (mobile && mobile === adminMobile()));
}

export function adminOtpSecret() {
  return process.env.ADMIN_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function otpHash(identifier: string, otp: string, expiresAt: number) {
  return crypto.createHmac("sha256", adminOtpSecret()).update(`${normalizeIdentifier(identifier)}:${otp}:${expiresAt}`).digest("hex");
}

// Keep the established admin session token format so all existing admin APIs
// continue to accept the OTP-authenticated session.
export function sessionToken(_identifier: string) {
  return crypto.createHmac("sha256", adminOtpSecret()).update(adminEmail()).digest("hex");
}

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}
