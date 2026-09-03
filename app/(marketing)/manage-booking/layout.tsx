import { getLocale, getTranslations } from "next-intl/server";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/manage-booking",
    locale,
    fallbackTitle: t("manageBookingTitle"),
    fallbackDescription: t("manageBookingDescription"),
    path: "/manage-booking",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
