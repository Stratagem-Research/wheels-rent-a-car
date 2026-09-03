import type { Metadata } from "next";
import { getLocalizedString } from "@/lib/i18n/localized";
import { getPageSeoByKey } from "@/lib/supabase/seo-repository";

const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  ar: "ar_LB",
  fr: "fr_LB",
};

const DEFAULT_OG_IMAGE_PATH = "/images/Hero Images/ramy-kabalan-mF4_MHgp4ps-unsplash.jpg";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export interface ResolvePageMetadataOptions {
  /** Static page: the route path, e.g. "/chauffeur". Vehicle: "vehicle:<id>". */
  pageKey: string;
  locale: string;
  fallbackTitle: string;
  fallbackDescription: string;
  /** Public path used to build canonical/OG urls, e.g. "/chauffeur". */
  path: string;
  /** Full https:// image URL to fall back to instead of the generic site
   *  default — e.g. a vehicle's own hero photo on a vehicle detail page. */
  fallbackImage?: string;
}

/**
 * Single place that turns a `page_seo` row (admin-edited, may be absent) plus
 * translation-file fallbacks into a complete Next.js Metadata object —
 * OpenGraph/Twitter/canonical included. Every page's generateMetadata should
 * go through this so pages never hand-roll OG tags individually.
 */
export async function resolvePageMetadata(options: ResolvePageMetadataOptions): Promise<Metadata> {
  const { pageKey, locale, fallbackTitle, fallbackDescription, path, fallbackImage } = options;

  let row = null;
  try {
    row = await getPageSeoByKey(pageKey);
  } catch {
    // SEO table unreachable — fall back to translation-file defaults rather
    // than failing the page render.
    row = null;
  }

  const title = row?.meta_title
    ? getLocalizedString(row.meta_title, locale) || fallbackTitle
    : fallbackTitle;
  const description = row?.meta_description
    ? getLocalizedString(row.meta_description, locale) || fallbackDescription
    : fallbackDescription;

  const canonicalPath = row?.canonical_url ?? path;
  const canonicalUrl = `${siteUrl()}${canonicalPath}`;
  const ogImage =
    row?.og_image_url || fallbackImage || `${siteUrl()}${encodeURI(DEFAULT_OG_IMAGE_PATH)}`;

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      siteName: "Wheels Rent A Car",
      title,
      description,
      url: canonicalUrl,
      locale: OG_LOCALE_MAP[locale] ?? OG_LOCALE_MAP.en,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };

  if (row?.noindex) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}
