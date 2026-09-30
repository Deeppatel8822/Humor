import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const phone = String(body.phone || "").trim();

    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    if (!/^\+?[1-9]\d{9,14}$/.test(phone.replace(/[\s-]/g, ""))) return NextResponse.json({ error: "Enter a valid mobile number with country code." }, { status: 400 });

    const admin = supabaseAdmin();
    const { data: existing } = await admin.from("customers").select("id").or("email.eq." + email + ",phone.eq." + phone).maybeSingle();
    if (existing) return NextResponse.json({ error: "An account already exists with this email or mobile number. Please login." }, { status: 409 });

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phone },
    });
    if (error || !data.user) throw error || new Error("Could not create account.");

    const customerRes = await admin.from("customers").insert({ email, phone, full_name: null }).select("id,email,phone,full_name").single();
    if (customerRes.error) {
      await admin.auth.admin.deleteUser(data.user.id);
      throw customerRes.error;
    }

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error("Customer signup error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create account." }, { status: 400 });
  }
}
