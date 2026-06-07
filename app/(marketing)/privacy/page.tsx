import { getTranslations } from "next-intl/server";
import { LegalArticle } from "@/components/help/LegalArticle";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("privacyTitle"), description: t("privacyDescription") };
}

export default function PrivacyPage() {
  return <LegalArticle slug="privacy" />;
}
