import { validAdminSession } from "@/lib/adminAuth";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/adminPassword";

export async function POST(request: NextRequest) {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
    if (!email || !validAdminSession(request.cookies.get("humor_admin")?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newPassword } = await request.json();
    if (typeof newPassword !== "string" || newPassword.length < 10) {
      return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
    }

    const db = supabaseAdmin();
    const password_hash = hashPassword(newPassword);
    const { error } = await db.from("admin_users").upsert(
      { email, mobile: process.env.ADMIN_MOBILE || null, full_name: "Administrator", password_hash, role: "owner", is_active: true, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error) return NextResponse.json({ error: "Unable to update password." }, { status: 500 });

    return NextResponse.json({ success: true, message: "Password changed successfully." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
