import { shopifyFetch } from "./client";
import {
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_COLLECTION_PRODUCTS_QUERY,
} from "./queries";
import { Product } from "@/types/product";

// Shopify's GraphQL response shapes — intentionally loose (not the full
// Storefront API schema), just what mapProduct() below reads.
interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}
interface ShopifyImage {
  url: string;
  altText: string | null;
}
interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
}
interface ShopifyMetafield {
  key: string;
  value: string;
}
interface ShopifyProductNode {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  totalInventory: number;
  featuredImage: ShopifyImage | null;
  images: { edges: { node: ShopifyImage }[] };
  priceRange: { minVariantPrice: ShopifyMoney };
  compareAtPriceRange: { minVariantPrice: ShopifyMoney } | null;
  variants: { edges: { node: ShopifyVariant }[] };
  metafields: (ShopifyMetafield | null)[];
}

function metafield(fields: (ShopifyMetafield | null)[], key: string): string | null {
  return fields.find((f) => f?.key === key)?.value ?? null;
}

function metafieldList(fields: (ShopifyMetafield | null)[], key: string): string[] {
  const raw = metafield(fields, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

// Maps productType (set in Shopify Admin) to our category enum. Adjust to
// match however the Shopify catalog is actually organized.
function mapCategory(productType: string): Product["category"] {
  const t = productType.toLowerCase();
  if (t.includes("hair")) return "haircare";
  if (t.includes("body") || t.includes("shower")) return "bodycare";
  return "skincare";
}

function mapProduct(node: ShopifyProductNode): Product {
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const compareAt = node.compareAtPriceRange?.minVariantPrice.amount
    ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
    : null;
  const firstVariant = node.variants.edges[0]?.node;
  const stock = firstVariant?.quantityAvailable ?? (node.availableForSale ? 999 : 0);

  const keyIngredientsRaw = metafield(node.metafields, "key_ingredients");
  let keyIngredients: { name: string; explanation: string }[] = [];
  if (keyIngredientsRaw) {
    try {
      keyIngredients = JSON.parse(keyIngredientsRaw);
    } catch {
      // Metafield wasn't valid JSON — leave empty rather than guessing at a shape.
    }
  }

  return {
    id: node.id,
    slug: node.handle,
    name: node.title,
    tagline: null,
    description: node.description,
    key_benefits: metafieldList(node.metafields, "key_benefits"),
    key_ingredients: keyIngredients,
    full_ingredient_list: metafield(node.metafields, "full_ingredient_list"),
    skin_hair_type: metafieldList(node.metafields, "skin_hair_type"),
    how_to_use: metafield(node.metafields, "how_to_use"),
    category: mapCategory(node.productType),
    subrange: metafield(node.metafields, "subrange"),
    concern_tags: metafieldList(node.metafields, "concern_tags"),
    routine_tags: metafieldList(node.metafields, "routine_tags"),
    price_inr: Math.round(price),
    compare_at_price_inr: compareAt ? Math.round(compareAt) : null,
    stock_quantity: stock,
    sku: node.id,
    shopify_variant_id: firstVariant?.id ?? null,
    images: node.images.edges.map((e) => e.node.url),
    before_after_images: [],
    is_bestseller: node.tags.includes("bestseller"),
    is_featured: node.tags.includes("featured"),
    is_new: node.tags.includes("new"),
    rating: 0,
    review_count: 0,
    status: node.availableForSale ? "live" : "draft",
  };
}

export async function fetchShopifyProducts(limit = 50): Promise<Product[]> {
  const data = await shopifyFetch<{ products: { edges: { node: ShopifyProductNode }[] } }>({
    query: GET_PRODUCTS_QUERY,
    variables: { first: limit },
  });
  return data.products.edges.map((e) => mapProduct(e.node));
}

export async function fetchShopifyProductByHandle(handle: string): Promise<Product | null> {
  const data = await shopifyFetch<{ product: ShopifyProductNode | null }>({
    query: GET_PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    cache: "no-store",
  });
  return data.product ? mapProduct(data.product) : null;
}

export async function fetchShopifyCollectionProducts(
  handle: string,
  limit = 50
): Promise<{ title: string; description: string; products: Product[] } | null> {
  const data = await shopifyFetch<{
    collection: {
      title: string;
      description: string;
      products: { edges: { node: ShopifyProductNode }[] };
    } | null;
  }>({
    query: GET_COLLECTION_PRODUCTS_QUERY,
    variables: { handle, first: limit },
  });
  if (!data.collection) return null;
  return {
    title: data.collection.title,
    description: data.collection.description,
    products: data.collection.products.edges.map((e) => mapProduct(e.node)),
  };
}
