import { getLocale, getTranslations } from "next-intl/server";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/trips",
    locale,
    fallbackTitle: t("tripsTitle"),
    fallbackDescription: t("tripsDescription"),
    path: "/trips",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
