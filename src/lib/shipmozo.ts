const API_BASE = "https://shipping-api.com/app/api/v1";

export class ShipmozoError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

export async function shipmozoRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const publicKey = process.env.SHIPMOZO_PUBLIC_KEY;
  const privateKey = process.env.SHIPMOZO_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new ShipmozoError("Shipmozo API keys are not configured on the server.", 503);
  const response = await fetch(`${API_BASE}/${path.replace(/^\/+/, "")}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "public-key": publicKey,
      "private-key": privateKey,
      ...(init.headers || {}),
    },
    cache: "no-store",
    signal: init.signal || AbortSignal.timeout(20000),
  });
  const raw = await response.text();
  let payload: any;
  try { payload = raw ? JSON.parse(raw) : {}; } catch { throw new ShipmozoError("Shipmozo returned an unreadable response."); }
  if (!response.ok) throw new ShipmozoError(`Shipmozo HTTP ${response.status}: ${String(payload?.message || "Request failed")}`);
  if (String(payload?.result) === "0" || payload?.success === false) {
    throw new ShipmozoError(String(payload?.message || "Shipmozo rejected the request."), 400);
  }
  return payload as T;
}

export function getShipmozoWarehouseId() {
  return process.env.SHIPMOZO_WAREHOUSE_ID?.trim() || "";
}

export function normalizePhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}
