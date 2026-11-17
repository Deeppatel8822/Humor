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

export async function GET() {
  const store = await cookies();
  if (!validAdmin(store.get("humor_admin")?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const response = await shipmozoRequest<any>("get-warehouses");
    const warehouses = Array.isArray(response?.data) ? response.data : [];
    return NextResponse.json({ success: true, configuredWarehouseId: process.env.SHIPMOZO_WAREHOUSE_ID || "", warehouses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch warehouses.";
    return NextResponse.json({ error: message }, { status: error instanceof ShipmozoError ? error.status : 502 });
  }
}
