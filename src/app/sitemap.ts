import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/catalog";

const siteUrl = "https://humorluxury.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = [
    { route: "", priority: 1, changeFrequency: "weekly" as const },
    { route: "/shop", priority: 0.9, changeFrequency: "daily" as const },
    { route: "/collections/skin-care", priority: 0.8, changeFrequency: "weekly" as const },
    { route: "/collections/hair-care", priority: 0.8, changeFrequency: "weekly" as const },
    { route: "/collections/body-care", priority: 0.7, changeFrequency: "weekly" as const },
    { route: "/build-your-routine", priority: 0.7, changeFrequency: "monthly" as const },
    { route: "/about", priority: 0.5, changeFrequency: "monthly" as const },
    { route: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
    { route: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" as const },
  ];

  let products: Awaited<ReturnType<typeof getAllProducts>> = [];
  try {
    products = await getAllProducts();
  } catch (error) {
    console.error("Unable to build product sitemap:", error);
  }

  return [
    ...staticRoutes.map(({ route, priority, changeFrequency }) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...products
      .filter((product) => product.status === "live" && product.slug)
      .map((product) => ({
        url: `${siteUrl}/product/${encodeURIComponent(product.slug)}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  ];
}
