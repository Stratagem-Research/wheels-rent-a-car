import { getTranslations } from "next-intl/server";
import { LegalArticle } from "@/components/help/LegalArticle";

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("cookiesTitle"), description: t("cookiesDescription") };
}

export default function CookiesPage() {
  return <LegalArticle slug="cookies" />;
}
