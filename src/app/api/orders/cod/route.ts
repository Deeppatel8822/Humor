import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface CodLine {
  productId: string;
  quantity: number;
}

interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      lines?: CodLine[];
      shipping?: ShippingDetails;
    };

    const lines = body.lines ?? [];
    const shipping = body.shipping;

    if (!lines.length || !shipping) {
      return NextResponse.json({ error: "Order details are incomplete." }, { status: 400 });
    }

    if (
      !shipping.fullName?.trim() ||
      !shipping.email?.trim() ||
      !shipping.phone?.trim() ||
      !shipping.line1?.trim() ||
      !shipping.city?.trim() ||
      !shipping.state?.trim() ||
      !/^\d{6}$/.test(shipping.pincode)
    ) {
      return NextResponse.json({ error: "Please provide valid shipping details." }, { status: 400 });
    }

    for (const line of lines) {
      const catalogId = Number(line.productId);
      if (
        !Number.isInteger(catalogId) ||
        catalogId < 1 ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1
      ) {
        return NextResponse.json({ error: "Invalid product or quantity." }, { status: 400 });
      }
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase.rpc("create_cod_order", {
      p_lines: lines,
      p_shipping: shipping,
    });

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.order_number) {
      throw new Error("Could not create the COD order.");
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.order_number,
      totalInr: Number(result.total_inr),
    });
  } catch (error) {
    console.error("COD order error:", error);
    return NextResponse.json({ error: "Could not place your order. Please try again." }, { status: 500 });
  }
}
