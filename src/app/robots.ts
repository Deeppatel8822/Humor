import type { MetadataRoute } from "next";

const siteUrl = "https://www.humorluxury.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/cart", "/checkout", "/account", "/login", "/register"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
