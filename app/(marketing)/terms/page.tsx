import { getTranslations } from "next-intl/server";
import { LegalArticle } from "@/components/help/LegalArticle";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("termsTitle"), description: t("termsDescription") };
}

export default function TermsPage() {
  return <LegalArticle slug="terms" />;
}
