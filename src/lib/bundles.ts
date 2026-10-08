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

export function calculateBundleSavings(lines: Array<{ slug: string; quantity: number }>, products: Array<Pick<Product, "slug" | "price_inr">>) {
  const productMap = new Map(products.map((product) => [product.slug, product]));
  const remaining = new Map(lines.map((line) => [line.slug, Math.max(0, line.quantity)]));
  let savings = 0;

  const candidates = bundleDefinitions.map((bundle) => {
    const bundleProducts = bundle.slugs.map((slug) => productMap.get(slug)).filter(Boolean) as Product[];
    if (bundleProducts.length !== bundle.slugs.length) return null;
    const possible = Math.min(...bundle.slugs.map((slug) => remaining.get(slug) ?? 0));
    if (possible <= 0) return null;
    return {
      bundle,
      bundleProducts,
      possible,
      saved: Math.max(0, bundleTotal(bundleProducts) - bundlePrice(bundleProducts, bundle.name)),
    };
  }).filter(Boolean) as Array<{ bundle: BundleDefinition; bundleProducts: Product[]; possible: number; saved: number }>;

  candidates.sort((a, b) => (b.saved / b.bundleProducts.length) - (a.saved / a.bundleProducts.length));

  for (const candidate of candidates) {
    const count = Math.min(candidate.possible, ...candidate.bundle.slugs.map((slug) => remaining.get(slug) ?? 0));
    if (count <= 0) continue;
    savings += candidate.saved * count;
    candidate.bundle.slugs.forEach((slug) => remaining.set(slug, (remaining.get(slug) ?? 0) - count));
  }

  return Math.round(savings);
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
