import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { resetTokenHash } from "@/lib/adminPassword";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
    const requested = String(email || "").trim().toLowerCase();

    if (!adminEmail || requested !== adminEmail) {
      return NextResponse.json({ success: true, message: "If that email is registered, a reset link will be sent." });
    }

    const db = supabaseAdmin();
    const { data: user } = await db.from("admin_users").select("id,email").eq("email", adminEmail).maybeSingle();
    if (!user) {
      return NextResponse.json({ success: true, message: "If that email is registered, a reset link will be sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = resetTokenHash(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { error } = await db.from("admin_password_resets").insert({ admin_user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });
    if (error) return NextResponse.json({ error: "Unable to create reset request." }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const resetUrl = `${appUrl}/admin/reset-password?token=${token}`;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.ADMIN_RESET_FROM_EMAIL || adminEmail;
    if (!apiKey) return NextResponse.json({ error: "Email provider is not configured yet." }, { status: 503 });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [adminEmail],
        subject: "Humor Luxury Admin Password Reset",
        html: `<p>Your Humor Luxury admin password reset was requested.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>This link expires in 30 minutes.</p>`,
      }),
    });
    if (!emailResponse.ok) return NextResponse.json({ error: "Unable to send reset email." }, { status: 502 });

    return NextResponse.json({ success: true, message: "Password reset email sent." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
