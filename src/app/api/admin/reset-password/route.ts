import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, resetTokenHash } from "@/lib/adminPassword";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();
    if (typeof token !== "string" || token.length < 20) return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
    if (typeof newPassword !== "string" || newPassword.length < 10) return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });

    const db = supabaseAdmin();
    const tokenHash = resetTokenHash(token);
    const { data: reset } = await db.from("admin_password_resets").select("id,admin_user_id,expires_at,used_at").eq("token_hash", tokenHash).maybeSingle();
    if (!reset || reset.used_at || new Date(reset.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });

    const { error: updateError } = await db.from("admin_users").update({ password_hash: hashPassword(newPassword), updated_at: new Date().toISOString() }).eq("id", reset.admin_user_id);
    if (updateError) return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
    await db.from("admin_password_resets").update({ used_at: new Date().toISOString() }).eq("id", reset.id);

    return NextResponse.json({ success: true, message: "Password reset successfully." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
