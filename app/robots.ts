import type { MetadataRoute } from "next";

/**
 * robots.txt per 00_global.md §14.
 *
 * Allow everything except private funnel pages, the account area, the
 * mock service worker, and any /api/ surface that ships with Phase 1.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account/",
          "/book/checkout",
          "/book/confirmation/",
          "/api/",
          "/mockServiceWorker.js",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
