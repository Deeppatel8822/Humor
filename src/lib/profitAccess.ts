import crypto from "crypto";
import { hashPassword, verifyPassword } from "@/lib/adminPassword";

export const PROFIT_COOKIE = "humor_profit_access";
const COOKIE_TTL_SECONDS = 8 * 60 * 60;

export function profitCookieValue(passwordHash: string, issuedAt: number) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_OTP_SECRET || "";
  return `${issuedAt}.${crypto.createHmac("sha256", secret).update(`profit:${passwordHash}:${issuedAt}`).digest("hex")}`;
}

export function validProfitCookie(value: string | undefined, passwordHash: string) {
  if (!value) return false;
  const [issuedRaw, signature] = value.split(".");
  const issuedAt = Number(issuedRaw);
  if (!issuedAt || !signature || Date.now() - issuedAt > COOKIE_TTL_SECONDS * 1000 || issuedAt > Date.now() + 60_000) return false;
  const expected = profitCookieValue(passwordHash, issuedAt).split(".")[1];
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export { COOKIE_TTL_SECONDS, hashPassword, verifyPassword };
