import { Product } from "@/types/product";
import { isShopifyConfigured } from "./shopify/client";
import {
  fetchShopifyProducts,
  fetchShopifyProductByHandle,
  fetchShopifyCollectionProducts,
} from "./shopify/adapter";
import * as local from "./products";

export async function getAllProducts(): Promise<Product[]> {
  if (isShopifyConfigured()) {
    try {
      return await fetchShopifyProducts();
    } catch (err) {
      console.error("Shopify fetch failed, falling back to local catalog:", err);
    }
  }
  return local.getProducts();
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (isShopifyConfigured()) {
    try {
      const product = await fetchShopifyProductByHandle(slug);
      if (product) return product;
    } catch (err) {
      console.error("Shopify fetch failed, falling back to local catalog:", err);
    }
  }
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
  // Prefer a real Shopify collection (e.g. handle "hair-care") when configured,
  // since collections may be curated/ordered differently than a raw category filter.
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
