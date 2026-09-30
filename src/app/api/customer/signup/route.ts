import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const address = body.address || {};

    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    if (!fullName) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!/^\+?[1-9]\d{9,14}$/.test(phone.replace(/[\s-]/g, ""))) return NextResponse.json({ error: "Enter a valid mobile number with country code." }, { status: 400 });
    if (!address.line1 || !address.city || !address.state || !/^\d{6}$/.test(String(address.pincode || ""))) {
      return NextResponse.json({ error: "Please enter a valid address and 6-digit pincode." }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: existing } = await admin.from("customers").select("id").or("email.eq." + email + ",phone.eq." + phone).maybeSingle();
    if (existing) return NextResponse.json({ error: "An account already exists with this email or mobile number. Please login." }, { status: 409 });

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });
    if (error || !data.user) throw error || new Error("Could not create account.");

    const customerRes = await admin.from("customers").insert({ email, phone, full_name: fullName }).select("id,email,phone,full_name").single();
    if (customerRes.error) {
      await admin.auth.admin.deleteUser(data.user.id);
      throw customerRes.error;
    }

    const addressRes = await admin.from("addresses").insert({
      customer_id: customerRes.data.id,
      line1: String(address.line1),
      line2: String(address.line2 || "").trim() || null,
      city: String(address.city),
      state: String(address.state),
      pincode: String(address.pincode),
      country: "India",
      phone,
    });
    if (addressRes.error) throw addressRes.error;

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error("Customer signup error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create account." }, { status: 400 });
  }
}
