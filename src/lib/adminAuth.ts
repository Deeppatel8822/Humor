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


export type AdminOtpRateLimitAction = "request" | "verify";

export async function checkAdminOtpRateLimit(
  request: Request,
  identifier: string,
  action: AdminOtpRateLimitAction,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceKey) {
    // Fail closed: OTP endpoints must not silently run without shared rate limiting.
    return { allowed: false, retryAfterSeconds: 60, unavailable: true };
  }

  const forwarded = request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip")
    || "unknown";
  const ip = forwarded.split(",")[0].trim().slice(0, 100) || "unknown";
  const rateKey = crypto.createHash("sha256")
    .update(`${action}:${ip}:${normalizeIdentifier(identifier)}`)
    .digest("hex");

  const response = await fetch(`${supabaseUrl.replace(/\\/$/, "")}/rest/v1/rpc/admin_otp_rate_limit_check`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_rate_key: rateKey,
      p_action: action,
      p_limit: action === "request" ? 3 : 5,
      p_window_seconds: action === "request" ? 900 : 600,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    // Fail closed if the database limiter is unavailable or misconfigured.
    return { allowed: false, retryAfterSeconds: 60, unavailable: true };
  }

  const result = await response.json() as {
    allowed?: boolean;
    retryAfterSeconds?: number;
  };
  return {
    allowed: result.allowed === true,
    retryAfterSeconds: Math.max(1, Number(result.retryAfterSeconds) || 60),
    unavailable: false,
  };
}
