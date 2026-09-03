import { getLocale, getTranslations } from "next-intl/server";
import { LegalArticle } from "@/components/help/LegalArticle";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/terms",
    locale,
    fallbackTitle: t("termsTitle"),
    fallbackDescription: t("termsDescription"),
    path: "/terms",
  });
}

export default function TermsPage() {
  return <LegalArticle slug="terms" />;
}
