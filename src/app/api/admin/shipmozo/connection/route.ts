import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "humor_admin";
const API_BASE = "https://shipping-api.com/app/api/v1";

function validAdmin(value: string | undefined) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!email || !value || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET() {
  const store = await cookies();
  if (!validAdmin(store.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.SHIPMOZO_PUBLIC_KEY;
  const privateKey = process.env.SHIPMOZO_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({
      connected: false,
      configured: false,
      message: "Add SHIPMOZO_PUBLIC_KEY and SHIPMOZO_PRIVATE_KEY to the server environment before testing the connection.",
    });
  }

  try {
    const response = await fetch(`${API_BASE}/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "public-key": publicKey,
        "private-key": privateKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const raw = await response.text();
    let payload: unknown;
    try { payload = JSON.parse(raw); } catch { payload = { message: raw.slice(0, 500) }; }
    if (!response.ok) {
      console.error("Shipmozo connection test returned HTTP", response.status);
      return NextResponse.json({ connected: false, configured: true, message: `Shipmozo returned HTTP ${response.status}. Check credentials and API access.` }, { status: 502 });
    }
    const result = payload && typeof payload === "object" ? (payload as Record<string, unknown>).result : undefined;
    const failed = result === "0" || result === 0 || (payload as Record<string, unknown> | null)?.success === false;
    return NextResponse.json({
      connected: !failed,
      configured: true,
      message: failed ? "Shipmozo did not accept the connection test. Verify the API keys with Shipmozo support." : "Shipmozo API responded. Connection credentials appear to be accepted.",
    });
  } catch (error) {
    console.error("Shipmozo connection test failed:", error);
    return NextResponse.json({ connected: false, configured: true, message: "Could not reach Shipmozo. Check network access and API availability." }, { status: 502 });
  }
}
