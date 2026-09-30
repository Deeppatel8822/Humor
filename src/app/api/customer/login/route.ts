import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier || "").trim();
    const password = String(body.password || "");
    if (!identifier || !password) return NextResponse.json({ error: "Enter your email/mobile and password." }, { status: 400 });

    let email = identifier.toLowerCase();
    if (!identifier.includes("@")) {
      const phone = identifier.replace(/[\s-]/g, "");
      const admin = supabaseAdmin();
      const { data: customer } = await admin.from("customers").select("email").eq("phone", phone).maybeSingle();
      if (!customer?.email) return NextResponse.json({ error: "Invalid mobile/email or password." }, { status: 401 });
      email = customer.email;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return NextResponse.json({ error: "Invalid mobile/email or password." }, { status: 401 });

    return NextResponse.json({ session: data.session });
  } catch {
    return NextResponse.json({ error: "Could not login. Please try again." }, { status: 400 });
  }
}
