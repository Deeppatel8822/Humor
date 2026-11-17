import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { shipmozoRequest, ShipmozoError } from "@/lib/shipmozo";

function validAdmin(value?: string) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!email || !value || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  const a = Buffer.from(value), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const store = await cookies();
  if (!validAdmin(store.get("humor_admin")?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const awb = new URL(request.url).searchParams.get("awb_number")?.trim();
  if (!awb) return NextResponse.json({ error: "AWB number is required." }, { status: 400 });
  try {
    const result = await shipmozoRequest<any>(`get-order-label/${encodeURIComponent(awb)}`);
    const label = Array.isArray(result?.data) ? result.data[0]?.label : result?.data?.label;
    if (typeof label !== "string" || !label.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "Shipmozo did not return a valid PNG label." }, { status: 502 });
    }
    return NextResponse.json({ success: true, awb_number: awb, label });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch shipping label.";
    return NextResponse.json({ error: message }, { status: error instanceof ShipmozoError ? error.status : 502 });
  }
}
