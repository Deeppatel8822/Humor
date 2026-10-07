import { NextResponse } from "next/server";
import { findPartnerByCode, calculatePartnerDiscount, PARTNER_MAX_DISCOUNT_PER_UNIT } from "@/lib/marketingPartner";
import { products } from "@/lib/products";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim();
    const lines = Array.isArray(body.lines) ? body.lines : [];
    if (!code) return NextResponse.json({ valid: false, error: "Enter a vendor code." }, { status: 400 });

    const found = await findPartnerByCode(code);
    if (!found) return NextResponse.json({ valid: false, error: "Invalid or expired vendor code." }, { status: 404 });

    const pricedLines = lines.map((line: { productId?: string; quantity?: number }) => {
      const product = products.find((item) => item.id === line.productId);
      return product ? { priceInr: product.price_inr, quantity: Math.max(1, Number(line.quantity) || 1) } : null;
    }).filter(Boolean) as { priceInr: number; quantity: number }[];

    const discount = calculatePartnerDiscount(pricedLines);
    return NextResponse.json({
      valid: true,
      code: found.partner.code,
      discountInr: discount,
      maxDiscountPerUnit: PARTNER_MAX_DISCOUNT_PER_UNIT,
      expiresAt: found.partner.expiresAt,
      remainingUses: Math.max(0, Number(found.partner.usageLimit ?? 1000) - Number(found.partner.usageCount ?? 0)),
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Could not validate vendor code." }, { status: 400 });
  }
}
