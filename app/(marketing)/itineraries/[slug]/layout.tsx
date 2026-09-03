import { getLocale, getTranslations } from "next-intl/server";
import { getLocalizedString } from "@/lib/i18n/localized";
import { listItinerariesFromDb } from "@/lib/supabase/cms-repository";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [locale, t, itineraries] = await Promise.all([
    getLocale(),
    getTranslations("meta"),
    listItinerariesFromDb().catch(() => []),
  ]);
  const itinerary = itineraries.find((item) => item.slug === slug);
  const fallbackTitle = itinerary
    ? `${getLocalizedString(itinerary.title, locale)} · Wheels Rent A Car`
    : t("itinerariesTitle");
  const fallbackDescription = itinerary
    ? getLocalizedString(itinerary.excerpt, locale)
    : t("itinerariesDescription");

  return resolvePageMetadata({
    pageKey: `/itineraries/${slug}`,
    locale,
    fallbackTitle,
    fallbackDescription,
    path: `/itineraries/${slug}`,
  });
}

export default function Layout({ children }: LayoutProps) {
  return children;
}
