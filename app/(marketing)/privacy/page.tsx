import { getLocale, getTranslations } from "next-intl/server";
import { LegalArticle } from "@/components/help/LegalArticle";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/privacy",
    locale,
    fallbackTitle: t("privacyTitle"),
    fallbackDescription: t("privacyDescription"),
    path: "/privacy",
  });
}

export default function PrivacyPage() {
  return <LegalArticle slug="privacy" />;
}
