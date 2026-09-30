import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return NextResponse.json({ firstOrder: false }, { status: 401 });

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ firstOrder: false }, { status: 401 });

  const user = data.user;
  const identity = user.email || user.phone || "";
  const field = user.email ? "email" : "phone";
  const { data: customer } = await admin.from("customers").select("id").eq(field, identity).maybeSingle();

  if (!customer) return NextResponse.json({ firstOrder: true });

  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customer.id);

  return NextResponse.json({ firstOrder: (count ?? 0) === 0 });
}
