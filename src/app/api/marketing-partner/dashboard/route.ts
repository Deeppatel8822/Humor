import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getPartner } from "@/lib/marketingPartner";

export async function GET(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Please login first." }, { status: 401 });

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

  const partner = getPartner(data.user);
  return NextResponse.json({
    partner,
    active: partner?.status === "approved" && Boolean(partner.code),
  });
}
