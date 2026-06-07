import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing, isAppLocale } from "./routing";

/**
 * next-intl request config. Phase 1 ships English only — no URL prefix,
 * single locale, single message bundle. Phase 2 adds AR + FR by switching
 * `locale` to read from a cookie/route param and loading per-locale JSON.
 *
 * Per CLAUDE.md §5: "Architecture must be ready for Arabic (RTL) and French
 * in Phase 2 — use a routing-aware i18n library (next-intl) and put copy in
 * message catalogs from day one."
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const fallbackLocale = routing.defaultLocale ?? "en";
  const requested = await requestLocale;
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  let locale: string = fallbackLocale;
  if (requested && isAppLocale(requested)) {
    locale = requested;
  } else if (cookieLocale && isAppLocale(cookieLocale)) {
    locale = cookieLocale;
  }
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, messages };
});
