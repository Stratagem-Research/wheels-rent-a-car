import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "fr"],
  defaultLocale: "en",
  // Phase 1 ships unprefixed URLs; locale is handled by next-intl request config.
  localePrefix: "never",
});

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: string): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}

export function isRtlLocale(locale: string): boolean {
  return locale === "ar";
}
