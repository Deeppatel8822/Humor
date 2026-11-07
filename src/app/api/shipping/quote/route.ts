import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { shipmozoRequest, ShipmozoError, getShipmozoWarehouseId } from "@/lib/shipmozo";

type QuoteBody = {
  lines?: { productId: string; quantity: number }[];
  deliveryPincode?: string;
  paymentType?: "PREPAID" | "COD";
  orderAmount?: number;
  codAmount?: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as QuoteBody;
    const lines = body.lines || [];
    const deliveryPincode = String(body.deliveryPincode || "");
    const paymentType = body.paymentType === "COD" ? "COD" : "PREPAID";
    if (!lines.length || !/^\d{6}$/.test(deliveryPincode)) {
      return NextResponse.json({ error: "Cart and valid delivery pincode are required." }, { status: 400 });
    }
    if (lines.some(line => !line.productId || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 50)) {
      return NextResponse.json({ error: "Invalid cart quantities." }, { status: 400 });
    }
    const warehouseId = getShipmozoWarehouseId();
    if (!warehouseId) return NextResponse.json({ error: "Set SHIPMOZO_WAREHOUSE_ID to your active pickup warehouse ID." }, { status: 503 });

    const ids = [...new Set(lines.map(line => line.productId))];
    const { data: products, error } = await supabaseAdmin().from("products")
      .select("id,name,sku,weight_grams,length_cm,width_cm,height_cm,status,price_inr")
      .in("id", ids);
    if (error) throw error;
    const byId = new Map((products || []).map(p => [String(p.id), p]));
    let weight = 0, orderAmount = 0;
    const packed = lines.map(line => {
      const p = byId.get(line.productId);
      if (!p || p.status !== "live") throw new ShipmozoError("A cart product is unavailable.", 400);
      if (![p.weight_grams,p.length_cm,p.width_cm,p.height_cm].every(v => Number(v) > 0)) {
        throw new ShipmozoError(`Package weight and dimensions are missing for ${p.name}. Ask admin to complete /admin/shipping.`, 400);
      }
      weight += Number(p.weight_grams) * line.quantity;
      orderAmount += Number(p.price_inr) * line.quantity;
      return { name: String(p.name), sku: String(p.sku), quantity: line.quantity, length: Number(p.length_cm), width: Number(p.width_cm), height: Number(p.height_cm) };
    });
    // For multi-item carts, the API expects a package dimension array. This conservative
    // estimate stacks packed units vertically; validate final packed dimensions before booking.
    const length = Math.max(...packed.map(p => p.length));
    const width = Math.max(...packed.map(p => p.width));
    const height = packed.reduce((sum, p) => sum + p.height * p.quantity, 0);
    const payload = await shipmozoRequest("rate-calculator", {
      method: "POST",
      body: JSON.stringify({
        order_id: "",
        pickup_pincode: Number(process.env.SHIPMOZO_PICKUP_PINCODE),
        delivery_pincode: Number(deliveryPincode),
        payment_type: paymentType,
        shipment_type: "FORWARD",
        order_amount: Number.isFinite(Number(body.orderAmount)) ? Number(body.orderAmount) : orderAmount,
        type_of_package: process.env.SHIPMOZO_PACKAGE_TYPE || "SPS",
        rov_type: process.env.SHIPMOZO_ROV_TYPE || "ROV_OWNER",
        cod_amount: paymentType === "COD" ? String(body.codAmount ?? body.orderAmount ?? orderAmount) : "",
        weight: Math.ceil(weight),
        dimensions: [{ no_of_box: "1", length: String(length), width: String(width), height: String(height) }],
      }),
    });
    return NextResponse.json({ success: true, weightGrams: Math.ceil(weight), dimensions: { length, width, height }, provider: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not calculate shipping.";
    const status = error instanceof ShipmozoError ? error.status : 502;
    console.error("Shipmozo rate quote failed:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
