import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { checkAdminOtpRateLimit } from "@/lib/adminAuth";
import { PROFIT_COOKIE, COOKIE_TTL_SECONDS, hashPassword, verifyPassword, profitCookieValue, validProfitCookie } from "@/lib/profitAccess";

export const dynamic = "force-dynamic";
const db = () => supabaseAdmin();
const adminEmail = () => (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

async function getAccess() {
  const client = db();
  const { data, error } = await client.from("profit_management_access").select("id,password_hash").eq("id", "owner").maybeSingle();
  if (error) throw new Error("Profit Management storage is unavailable. Apply the database migration first.");
  if (data) return data as { id: string; password_hash: string };
  const { data: created, error: insertError } = await client.from("profit_management_access")
    .insert({ id: "owner", password_hash: hashPassword("Humor"), updated_at: new Date().toISOString() })
    .select("id,password_hash").single();
  if (insertError || !created) {
    const { data: retry } = await client.from("profit_management_access").select("id,password_hash").eq("id", "owner").maybeSingle();
    if (retry) return retry as { id: string; password_hash: string };
    throw new Error("Could not initialize Profit Management password.");
  }
  return created as { id: string; password_hash: string };
}

function isAuthorized(request: NextRequest, passwordHash: string) {
  return validProfitCookie(request.cookies.get(PROFIT_COOKIE)?.value, passwordHash);
}
function sessionResponse(passwordHash: string) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(PROFIT_COOKIE, profitCookieValue(passwordHash, Date.now()), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/", maxAge: COOKIE_TTL_SECONDS,
  });
  return response;
}
function genericForgot() {
  return NextResponse.json({ success: true, message: "If the admin email is configured, a password reset link will be sent." });
}

export async function GET(request: NextRequest) {
  try {
    const access = await getAccess();
    return NextResponse.json({ authenticated: isAuthorized(request, access.password_hash) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check access." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || "");
    const client = db();
    const access = await getAccess();

    if (action === "login") {
      const rate = await checkAdminOtpRateLimit(request, "profit-management-password", "verify");
      if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Password access is temporarily unavailable. Try again shortly." : "Too many password attempts. Please wait before trying again." }, { status: rate.unavailable ? 503 : 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
      const password = typeof body.password === "string" ? body.password : "";
      if (!verifyPassword(password, access.password_hash)) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
      return sessionResponse(access.password_hash);
    }

    if (action === "change") {
      if (!isAuthorized(request, access.password_hash)) return NextResponse.json({ error: "Please unlock Profit Management first." }, { status: 401 });
      const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
      const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
      if (!verifyPassword(currentPassword, access.password_hash)) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
      if (newPassword.length < 10) return NextResponse.json({ error: "New password must be at least 10 characters." }, { status: 400 });
      const { error } = await client.from("profit_management_access").update({ password_hash: hashPassword(newPassword), updated_at: new Date().toISOString() }).eq("id", "owner");
      if (error) return NextResponse.json({ error: "Could not update password." }, { status: 500 });
      const response = NextResponse.json({ success: true, message: "Profit Management password changed." });
      response.cookies.set(PROFIT_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
      return response;
    }

    if (action === "forgot") {
      const rate = await checkAdminOtpRateLimit(request, "profit-management-reset", "request");
      if (!rate.allowed) return NextResponse.json({ error: rate.unavailable ? "Password reset is temporarily unavailable. Try again shortly." : "Too many reset requests. Please wait before trying again." }, { status: rate.unavailable ? 503 : 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
      const requested = String(body.email || "").trim().toLowerCase();
      const owner = adminEmail();
      if (!owner || requested !== owner) return genericForgot();
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) return NextResponse.json({ error: "Password reset email is not configured. Add RESEND_API_KEY in Vercel." }, { status: 503 });
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { error: insertError } = await client.from("profit_management_resets").insert({ token_hash: tokenHash, expires_at: expiresAt });
      if (insertError) return NextResponse.json({ error: "Could not create a reset link. Apply the latest database migration." }, { status: 500 });
      const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
      const resetUrl = `${origin}/profit-management/reset?token=${token}`;
      const from = process.env.ADMIN_RESET_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "Humor Luxury <onboarding@resend.dev>";
      const sent = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [owner], subject: "Humor Luxury Profit Management Password Reset", html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Humor Luxury</h2><p>A password reset was requested for Profit Management.</p><p><a href="${resetUrl}">Reset Profit Management password</a></p><p>This one-time link expires in 30 minutes. If you did not request it, ignore this email.</p></div>` }),
      });
      if (!sent.ok) return NextResponse.json({ error: "Email provider could not send the reset link. Check Resend sender configuration." }, { status: 502 });
      return NextResponse.json({ success: true, message: "Password reset link sent to the admin email." });
    }

    if (action === "reset") {
      const token = typeof body.token === "string" ? body.token : "";
      const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
      if (token.length < 40) return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
      if (newPassword.length < 10) return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const { data: reset } = await client.from("profit_management_resets").select("id,expires_at,used_at").eq("token_hash", tokenHash).maybeSingle();
      if (!reset || reset.used_at || new Date(reset.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
      const { error: updateError } = await client.from("profit_management_access").update({ password_hash: hashPassword(newPassword), updated_at: new Date().toISOString() }).eq("id", "owner");
      if (updateError) return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
      await client.from("profit_management_resets").update({ used_at: new Date().toISOString() }).eq("id", reset.id);
      return NextResponse.json({ success: true, message: "Profit Management password reset. You can now unlock the section." });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Profit access error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}
