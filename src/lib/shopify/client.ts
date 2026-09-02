const API_VERSION = "2025-01";

export function isShopifyConfigured() {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  );
}

interface ShopifyFetchOptions {
  query: string;
  variables?: Record<string, unknown>;
  cache?: RequestCache;
}

// Thin wrapper around the Shopify Storefront GraphQL API. Every function in
// adapter.ts and cart.ts goes through this — swap the endpoint or add
// retry/logging here and it applies everywhere.
export async function shopifyFetch<T>({
  query,
  variables,
  cache = "force-cache",
}: ShopifyFetchOptions): Promise<T> {
  if (!isShopifyConfigured()) {
    throw new Error(
      "Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN."
    );
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const endpoint = `https://${domain}/api/${API_VERSION}/graphql.json`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
    cache,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Storefront API error (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}
