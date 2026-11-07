import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { getShipmozoWarehouseId, normalizePhone, shipmozoRequest, ShipmozoError } from "@/lib/shipmozo";

function validAdmin(value?: string) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!email || !value || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(email).digest("hex");
  const a = Buffer.from(value), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
async function authorized() {
  const store = await cookies();
  return validAdmin(store.get("humor_admin")?.value);
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const orderId = String(body.orderId || "").trim();
    const weight = Number(body.weightGrams), length = Number(body.lengthCm), width = Number(body.widthCm), height = Number(body.heightCm);
    if (!orderId || ![weight,length,width,height].every(v => Number.isFinite(v) && v > 0)) {
      return NextResponse.json({ error: "Order ID and verified packed weight/dimensions are required." }, { status: 400 });
    }
    const warehouseId = getShipmozoWarehouseId();
    if (!warehouseId) return NextResponse.json({ error: "Set SHIPMOZO_WAREHOUSE_ID to an active warehouse ID." }, { status: 503 });

    const db = supabaseAdmin();
    const { data: order, error: orderError } = await db.from("orders")
      .select("id,order_number,created_at,status,payment_status,subtotal_inr,total_inr,address:addresses(line1,line2,city,state,pincode,phone),customer:customers(full_name,email,phone),order_items(quantity,unit_price_inr,product:products(name,sku))")
      .eq("id", orderId).single();
    if (orderError || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const { data: existing } = await db.from("shipmozo_shipments").select("id,provider_order_id,awb_number,courier_name,shipment_status")
      .eq("order_id", order.id).maybeSingle();
    if (existing?.awb_number) return NextResponse.json({ success: true, alreadyBooked: true, shipment: existing });
    const address = Array.isArray(order.address) ? order.address[0] : order.address;
    const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer;
    if (!address || !customer) return NextResponse.json({ error: "Order delivery address or customer details are missing." }, { status: 400 });
    const phone = normalizePhone(address.phone || customer.phone);
    if (!phone || !/^\d{6}$/.test(String(address.pincode || ""))) return NextResponse.json({ error: "Order has invalid delivery phone or pincode." }, { status: 400 });

    const providerOrderId = String(order.order_number);
    const orderDate = new Date(order.created_at).toISOString().slice(0,10);
    const items = (order.order_items || []).map((item: any) => ({
      name: String(item.product?.name || "Humor Luxury Product"),
      sku_number: String(item.product?.sku || ""),
      quantity: Number(item.quantity),
      discount: "",
      hsn: "",
      unit_price: Number(item.unit_price_inr),
      product_category: "Other",
    }));
    if (!items.length) return NextResponse.json({ error: "Order has no line items." }, { status: 400 });

    const pushBody = {
      order_id: providerOrderId,
      order_date: orderDate,
      order_type: "ESSENTIALS",
      consignee_name: String(customer.full_name || "Customer"),
      consignee_phone: Number(phone),
      consignee_email: String(customer.email || ""),
      consignee_address_line_one: String(address.line1 || ""),
      consignee_address_line_two: String(address.line2 || ""),
      consignee_pin_code: Number(address.pincode),
      consignee_city: String(address.city || ""),
      consignee_state: String(address.state || ""),
      product_detail: items,
      payment_type: String(order.payment_status || "").toLowerCase() === "paid" ? "PREPAID" : "COD",
      cod_amount: String(order.payment_status || "").toLowerCase() === "paid" ? "" : String(order.total_inr),
      weight: Math.ceil(weight),
      length, width, height,
      warehouse_id: warehouseId,
      gst_ewaybill_number: "",
      gstin_number: "",
    };
    const { data: pending, error: pendingError } = await db.from("shipmozo_shipments").upsert({
      order_id: order.id, provider_order_id: providerOrderId, shipment_status: "pushing",
      package_weight_grams: weight, package_length_cm: length, package_width_cm: width, package_height_cm: height,
      request_snapshot: pushBody, updated_at: new Date().toISOString(),
    }, { onConflict: "order_id" }).select("id").single();
    if (pendingError) throw pendingError;

    const pushed = existing?.provider_order_id
      ? { result: "1", message: "Previously pushed order reused." }
      : await shipmozoRequest<any>("push-order", { method: "POST", body: JSON.stringify(pushBody) });
    let assigned: any = null;
    let assignmentError = "";
    try { assigned = await shipmozoRequest<any>("auto-assign-order", { method: "POST", body: JSON.stringify({ order_id: providerOrderId }) }); }
    catch (error) { assignmentError = error instanceof Error ? error.message : "Automatic courier assignment failed."; }
    const awb = String(assigned?.data?.awb_number || "");
    const courier = String(assigned?.data?.courier_company || assigned?.data?.courier_company_service || "");
    // Do not call schedule-pickup blindly: Shipmozo says it is only required when\n    // rate-calculator returns pickups_automatically_scheduled = NO. That flag is\n    // not returned by auto-assign-order, so pickup scheduling remains manual here.\n    const finalData = {\n      shipment_status: awb ? "assigned" : "pushed_unassigned",
      awb_number: awb || null,
      courier_name: courier || null,
      response_snapshot: { push: pushed, assignment: assigned, assignment_error: assignmentError },
      updated_at: new Date().toISOString(),
    };
    const { data: saved, error: saveError } = await db.from("shipmozo_shipments").update(finalData).eq("id", pending.id).select("*").single();
    if (saveError) throw saveError;
    if (awb) await db.from("orders").update({ tracking_number: awb, updated_at: new Date().toISOString() }).eq("id", order.id);
    return NextResponse.json({ success: true, shipment: saved, note: awb ? "Courier assigned. Confirm pickup scheduling in Shipmozo; the API guide makes this conditional on the rate quote response." : `Order pushed, but courier assignment is pending: ${assignmentError || "No AWB was returned"}. Assign it from Shipmozo panel.` });
  } catch (error) {
    console.error("Shipmozo shipment push failed:", error);
    const message = error instanceof Error ? error.message : "Could not create Shipmozo shipment.";
    return NextResponse.json({ error: message }, { status: error instanceof ShipmozoError ? error.status : 502 });
  }
}
