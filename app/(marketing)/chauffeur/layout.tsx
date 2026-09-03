import { getLocale, getTranslations } from "next-intl/server";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/chauffeur",
    locale,
    fallbackTitle: t("chauffeurTitle"),
    fallbackDescription: t("chauffeurDescription"),
    path: "/chauffeur",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
