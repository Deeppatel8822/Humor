import { Product } from "@/types/product";

export interface BundleDefinition {
  name: string;
  slugs: string[];
}

export const bundleDefinitions: BundleDefinition[] = [
  { name: "Blemish Block Duo", slugs: ["blemish-block-face-wash", "blemish-block-face-serum"] },
  { name: "Fullmoon Duo", slugs: ["fullmoon-face-wash", "fullmoon-face-serum"] },
  { name: "Velvet Touch Duo", slugs: ["velvet-touch-face-wash", "velvet-touch-face-serum"] },
  { name: "Hair Care Ritual", slugs: ["repair-shampoo", "repair-conditioner", "repair-hair-mask"] },
  { name: "Fullmoon Complete Routine", slugs: ["fullmoon-face-wash", "fullmoon-face-serum", "sunscreen-spf-50"] },
  { name: "Blemish Block Complete Routine", slugs: ["blemish-block-face-wash", "blemish-block-face-serum", "sunscreen-spf-50"] },
  { name: "Velvet Touch Complete Routine", slugs: ["velvet-touch-face-wash", "velvet-touch-face-serum", "sunscreen-spf-50"] },
  { name: "Protein Shake Shampoo + Conditioner", slugs: ["repair-shampoo", "repair-conditioner"] },
  { name: "Protein Shake Shampoo + Hair Mask", slugs: ["repair-shampoo", "repair-hair-mask"] },
];

export function bundleTotal(products: Product[]) {
  return products.reduce((sum, product) => sum + product.price_inr, 0);
}

function isHairBundle(name: string) {
  const value = name.toLowerCase();
  return value.includes("hair") || value.includes("shampoo") || value.includes("conditioner") || value.includes("mask");
}

export function bundlePrice(products: Product[], bundleName: string) {
  const total = bundleTotal(products);
  const discountRate = isHairBundle(bundleName)
    ? total >= 1000 ? 0.09 : total >= 800 ? 0.06 : 0.12
    : total >= 800 ? 0.15 : 0.14;
  const discounted = total * (1 - discountRate);
  const step = discounted >= 1000 ? 100 : 50;
  return Math.max(1, Math.round(discounted / step) * step - 1);
}

export function bundleDiscountPercent(products: Product[], bundleName: string) {
  const total = bundleTotal(products);
  return total ? Math.round(((total - bundlePrice(products, bundleName)) / total) * 100) : 0;
}

export function calculateBundleSavings(
  lines: Array<{ slug: string; quantity: number }>,
  products: Array<Pick<Product, "slug" | "price_inr">>
) {
  const productMap = new Map(products.map((product) => [product.slug, product]));
  const initial = bundleDefinitions.map((bundle) => ({
    bundle,
    bundleProducts: bundle.slugs.map((slug) => productMap.get(slug)).filter(Boolean) as Array<Pick<Product, "slug" | "price_inr">>,
  })).filter((entry) => entry.bundleProducts.length === entry.bundle.slugs.length);

  const quantities = new Map(lines.map((line) => [line.slug, Math.max(0, line.quantity)]));
  const memo = new Map<string, number>();

  function solve(index: number, remaining: Map<string, number>): number {
    if (index >= initial.length) return 0;
    const key = index + "|" + initial.map((entry) => entry.bundle.slugs.map((slug) => remaining.get(slug) ?? 0).join(",")).join("|");
    const cached = memo.get(key);
    if (cached !== undefined) return cached;

    const entry = initial[index];
    const possible = Math.min(...entry.bundle.slugs.map((slug) => remaining.get(slug) ?? 0));
    let best = solve(index + 1, remaining);

    for (let count = 1; count <= possible; count += 1) {
      entry.bundle.slugs.forEach((slug) => remaining.set(slug, (remaining.get(slug) ?? 0) - 1));
      const saved = Math.max(0, bundleTotal(entry.bundleProducts as Product[]) - bundlePrice(entry.bundleProducts as Product[], entry.bundle.name));
      best = Math.max(best, saved * count + solve(index + 1, remaining));
    }

    entry.bundle.slugs.forEach((slug) => remaining.set(slug, (remaining.get(slug) ?? 0) + possible));
    memo.set(key, Math.round(best));
    return Math.round(best);
  }

  return solve(0, quantities);
}

export function getRoutineUpsells(product: Product, products: Product[]) {
  const map = new Map(products.map((item) => [item.slug, item]));
  return bundleDefinitions.filter((bundle) => bundle.slugs.includes(product.slug)).map((bundle) => {
    const bundleProducts = bundle.slugs.map((slug) => map.get(slug)).filter(Boolean) as Product[];
    if (bundleProducts.length !== bundle.slugs.length) return null;
    const missing = bundleProducts.filter((item) => item.slug !== product.slug);
    if (!missing.length) return null;
    const regularMissing = bundleTotal(missing);
    const specialMissing = Math.max(1, bundlePrice(bundleProducts, bundle.name) - product.price_inr);
    return { bundle, missing, regularMissing, specialMissing, saving: Math.max(0, regularMissing - specialMissing) };
  }).filter(Boolean) as Array<{
    bundle: BundleDefinition; missing: Product[]; regularMissing: number; specialMissing: number; saving: number;
  }>;
}
