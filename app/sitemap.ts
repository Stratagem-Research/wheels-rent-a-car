import type { MetadataRoute } from "next";
import { HELP_ARTICLES } from "@/lib/content/help";
import { routing } from "@/i18n/routing";
import { getPublicVehicles } from "@/lib/server/public-content";
import { getSiteUrl } from "@/lib/server/env";

// getPublicVehicles() hits Supabase/Wizard fresh on every call (no caching
// layer) — cache the sitemap route itself so a crawler doesn't trigger a
// full-catalog fetch on every hit.
export const revalidate = 3600;

/**
 * Sitemap per 00_global.md §14. Daily revalidation comes from
 * Next.js's default behaviour for static metadata routes; production
 * adds an explicit `revalidate` once we wire real fixtures.
 *
 * NOTE: `siteUrl` should be the deployed origin (set via env on Vercel).
 * Falls back to localhost for local dev — overwritten in CI.
 */

const siteUrl = getSiteUrl();

function url(path: string): string {
  return `${siteUrl}${path}`;
}

function languageAlternates(path: string): Record<string, string> {
  return Object.fromEntries(routing.locales.map((locale) => [locale, url(path)]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = [
    "/",
    "/vehicles",
    "/locations",
    "/long-term",
    "/chauffeur",
    "/car-wash",
    "/fleet-partnership",
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

  // One page per slug, not per inventory unit — several units of the same
  // brand/model share a single /vehicles/[slug] page.
  const vehicles = await getPublicVehicles().catch(() => []);
  const vehicleRoutes = [...new Set(vehicles.map((v) => `/vehicles/${v.slug}`))];

  const helpArticleRoutes = Object.keys(HELP_ARTICLES).map((s) => `/help/${s}`);

  // `localePrefix: "never"` (i18n/routing.ts) means every locale serves the
  // same unprefixed URL — locale-prefixed sitemap entries (/en/..., /ar/...)
  // get 302-redirected by proxy.ts, wasting crawl budget. One entry per path,
  // with `alternates.languages` communicating the hreflang relationship.
  return [
    ...staticRoutes.map((path) => ({
      url: url(path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: { languages: languageAlternates(path) },
    })),
    ...helpArticleRoutes.map((path) => ({
      url: url(path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
      alternates: { languages: languageAlternates(path) },
    })),
    ...vehicleRoutes.map((path) => ({
      url: url(path),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: { languages: languageAlternates(path) },
    })),
  ];
}
