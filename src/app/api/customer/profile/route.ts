import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const admin = supabaseAdmin();
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const user = authData.user;
    const email = user.email || null;
    const phone = user.phone || null;
    const fullName = String(body.fullName || user.user_metadata?.full_name || "").trim() || null;

    if (!email && !phone) return NextResponse.json({ error: "No email or mobile found in the account." }, { status: 400 });

    let existing = null;
    if (email) {
      const result = await admin.from("customers").select("id").eq("email", email).maybeSingle();
      if (result.error) throw result.error;
      existing = result.data;
    }
    if (!existing && phone) {
      const result = await admin.from("customers").select("id").eq("phone", phone).maybeSingle();
      if (result.error) throw result.error;
      existing = result.data;
    }

    const payload = { email, phone, full_name: fullName };
    const query = existing
      ? admin.from("customers").update(payload).eq("id", existing.id)
      : admin.from("customers").insert(payload);

    const { data, error } = await query.select("id,email,phone,full_name").single();
    if (error) {
      console.error("Customer profile sync error:", error);
      return NextResponse.json({ error: "Could not save customer profile. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ customer: data });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
