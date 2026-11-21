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

// Versioned, expiring and independently signed admin sessions.
// A fresh nonce prevents identical tokens across successive OTP logins.
function adminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function sessionToken(identifier: string, now = Date.now()) {
  const secret = adminSessionSecret();
  if (!secret || !adminEmail() || !isAdminIdentifier(identifier)) {
    throw new Error("Admin session configuration is invalid.");
  }
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({
    v: 1, sub: adminEmail(), exp: expiresAt, nonce: crypto.randomBytes(16).toString("hex"),
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function validAdminSession(value: string | undefined, now = Date.now()): boolean {
  const secret = adminSessionSecret();
  if (!secret || !adminEmail() || !value || value.length > 1024) return false;
  const parts = value.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return false;
  const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(parts[1], "base64url"); } catch { return false; }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as Record<string, unknown>;
    return data.v === 1 && data.sub === adminEmail() &&
      typeof data.exp === "number" && Number.isSafeInteger(data.exp) &&
      data.exp > now && data.exp <= now + SESSION_TTL_SECONDS * 1000 &&
      typeof data.nonce === "string" && /^[a-f0-9]{32}$/.test(data.nonce);
  } catch { return false; }
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

  // Normalize the URL separately; avoid regex literals inside template expressions.
  const baseUrl = supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl;
  const response = await fetch(`${baseUrl}/rest/v1/rpc/admin_otp_rate_limit_check`, {
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
    return { allowed: false, retryAfterSeconds: 60, unavailable: true };
  }

  const result = await response.json() as { allowed?: boolean; retryAfterSeconds?: number };
  return {
    allowed: result.allowed === true,
    retryAfterSeconds: Math.max(1, Number(result.retryAfterSeconds) || 60),
    unavailable: false,
  };
}
