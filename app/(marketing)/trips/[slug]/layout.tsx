import { getLocale, getTranslations } from "next-intl/server";
import { getLocalizedString } from "@/lib/i18n/localized";
import { listTripsFromDb } from "@/lib/supabase/cms-repository";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [locale, t, trips] = await Promise.all([
    getLocale(),
    getTranslations("meta"),
    listTripsFromDb().catch(() => []),
  ]);
  const trip = trips.find((item) => item.slug === slug);
  const fallbackTitle = trip
    ? `${getLocalizedString(trip.title, locale)} · Wheels Rent A Car`
    : t("tripsTitle");
  const fallbackDescription = trip ? getLocalizedString(trip.excerpt, locale) : t("tripsDescription");

  return resolvePageMetadata({
    pageKey: `/trips/${slug}`,
    locale,
    fallbackTitle,
    fallbackDescription,
    path: `/trips/${slug}`,
  });
}

export default function Layout({ children }: LayoutProps) {
  return children;
}
