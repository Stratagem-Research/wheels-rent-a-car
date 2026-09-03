import { getLocale, getTranslations } from "next-intl/server";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/fleet-partnership",
    locale,
    fallbackTitle: t("fleetPartnershipTitle"),
    fallbackDescription: t("fleetPartnershipDescription"),
    path: "/fleet-partnership",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
