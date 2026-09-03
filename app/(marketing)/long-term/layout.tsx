import { getLocale, getTranslations } from "next-intl/server";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/long-term",
    locale,
    fallbackTitle: t("longTermTitle"),
    fallbackDescription: t("longTermDescription"),
    path: "/long-term",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
