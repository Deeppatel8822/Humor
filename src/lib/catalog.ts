import { Product } from "@/types/product";
import { isShopifyConfigured } from "./shopify/client";
import {
  fetchShopifyProducts,
  fetchShopifyProductByHandle,
  fetchShopifyCollectionProducts,
} from "./shopify/adapter";
import { supabaseAdmin } from "./supabase";
import * as local from "./products";

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function fromDatabase(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: String(row.tagline ?? ""),
    description: String(row.description ?? ""),
    key_benefits: Array.isArray(row.key_benefits) ? row.key_benefits.map(String) : [],
    key_ingredients: Array.isArray(row.key_ingredients) ? row.key_ingredients as Product["key_ingredients"] : [],
    full_ingredient_list: String(row.full_ingredient_list ?? ""),
    skin_hair_type: Array.isArray(row.skin_hair_type) ? row.skin_hair_type.map(String) : [],
    how_to_use: String(row.how_to_use ?? ""),
    category: String(row.category) as Product["category"],
    subrange: null,
    concern_tags: Array.isArray(row.concern_tags) ? row.concern_tags.map(String) : [],
    routine_tags: Array.isArray(row.routine_tags) ? row.routine_tags.map(String) : [],
    price_inr: Number(row.price_inr),
    compare_at_price_inr: row.compare_at_price_inr == null ? null : Number(row.compare_at_price_inr),
    stock_quantity: Number(row.stock_quantity ?? 0),
    sku: String(row.sku),
    images: Array.isArray(row.images) ? row.images.map(String) : [],
    before_after_images: Array.isArray(row.before_after_images) ? row.before_after_images : [],
    is_bestseller: Boolean(row.is_bestseller),
    is_featured: Boolean(row.is_featured),
    is_new: false,
    rating: 0,
    review_count: 0,
    shopify_variant_id: null,
    status: String(row.status) as Product["status"],
  };
}

async function getDatabaseProducts(): Promise<Product[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabaseAdmin()
      .from("products")
      .select("id,catalog_id,slug,name,tagline,description,key_benefits,key_ingredients,full_ingredient_list,skin_hair_type,how_to_use,category,concern_tags,routine_tags,price_inr,compare_at_price_inr,stock_quantity,sku,images,before_after_images,is_bestseller,is_featured,status")
      .eq("status", "live")
      .order("catalog_id", { ascending: true });
    if (error) throw error;
    if (!data?.length) return null;
    return data.map((row) => fromDatabase(row as Record<string, unknown>));
  } catch (err) {
    console.error("Supabase catalog fetch failed, falling back:", err);
    return null;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  if (isShopifyConfigured()) {
    try {
      return await fetchShopifyProducts();
    } catch (err) {
      console.error("Shopify fetch failed, trying Supabase/local catalog:", err);
    }
  }

  const databaseProducts = await getDatabaseProducts();
  if (databaseProducts) return databaseProducts;
  return local.getProducts();
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (isShopifyConfigured()) {
    try {
      const product = await fetchShopifyProductByHandle(slug);
      if (product) return product;
    } catch (err) {
      console.error("Shopify fetch failed, trying Supabase/local catalog:", err);
    }
  }

  const databaseProducts = await getDatabaseProducts();
  const databaseProduct = databaseProducts?.find((product) => product.slug === slug);
  if (databaseProduct) return databaseProduct;
  return local.getProductBySlug(slug);
}

export async function getFeatured(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.is_featured);
}

export async function getByConcern(concern: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.concern_tags.includes(concern));
}

export async function getBySubrange(subrange: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.subrange === subrange);
}

export async function getByCategory(category: Product["category"]): Promise<Product[]> {
  if (isShopifyConfigured()) {
    const handle = category === "skincare" ? "skin-care" : category === "haircare" ? "hair-care" : "body-care";
    try {
      const collection = await fetchShopifyCollectionProducts(handle);
      if (collection) return collection.products;
    } catch (err) {
      console.error("Shopify collection fetch failed, falling back:", err);
    }
  }

  const all = await getAllProducts();
  return all.filter((p) => p.category === category);
}
