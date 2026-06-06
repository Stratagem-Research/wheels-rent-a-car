import type { MetadataRoute } from "next";
import { HELP_ARTICLES } from "@/lib/content/help";
import { routing } from "@/i18n/routing";

/**
 * Sitemap per 00_global.md §14. Daily revalidation comes from
 * Next.js's default behaviour for static metadata routes; production
 * adds an explicit `revalidate` once we wire real fixtures.
 *
 * NOTE: `siteUrl` should be the deployed origin (set via env on Vercel).
 * Falls back to localhost for local dev — overwritten in CI.
 */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function url(path: string): string {
  return `${siteUrl}${path}`;
}

function localized(path: string): string[] {
  return routing.locales.map((locale) => `/${locale}${path === "/" ? "" : path}`);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "/",
    "/vehicles",
    "/locations",
    "/long-term",
    "/chauffeur",
    "/corporate",
    "/trips",
    "/itineraries",
    "/about",
    "/contact",
    "/help",
    "/help/faq",
    "/manage-booking",
    "/privacy",
    "/terms",
    "/cookies",
  ];

  // Per-vehicle and per-category slug URLs were removed in Phase 7 — /vehicles
  // is now the single canonical results page. Filters (category, sort, auto)
  // ride on query params and stay out of the sitemap by design.

  const helpArticleRoutes = Object.keys(HELP_ARTICLES).map((s) => `/help/${s}`);

  return [
    ...staticRoutes.flatMap((path) =>
      localized(path).map((localizedPath) => ({
        url: url(localizedPath),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: path === "/" ? 1 : 0.7,
      })),
    ),
    ...helpArticleRoutes.flatMap((path) =>
      localized(path).map((localizedPath) => ({
        url: url(localizedPath),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
    ),
  ];
}
