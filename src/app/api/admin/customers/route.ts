import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

function authorized() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return async () => {
    const cookieStore = await cookies();
    const value = cookieStore.get("humor_admin")?.value;
    if (!email || !value || !secret) return false;
    const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
    return value === expected;
  };
}

export async function GET() {
  if (!(await authorized())()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin().from("customers").select("id,email,phone,full_name,created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load customers." }, { status: 500 });
  return NextResponse.json({ customers: data ?? [] });
}
