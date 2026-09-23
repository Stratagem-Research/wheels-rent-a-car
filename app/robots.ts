import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/server/env";

/**
 * robots.txt per 00_global.md §14.
 *
 * Allow everything except private funnel pages, the account area, and any
 * /api/ surface that ships with Phase 1.
 */
const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account/", "/book/checkout", "/book/confirmation/", "/api/", "/dev/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
