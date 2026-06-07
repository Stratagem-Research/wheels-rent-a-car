export const CMS_LOCALES = ["en", "ar", "fr"] as const;

export type CmsLocale = (typeof CMS_LOCALES)[number];

export type LocalizedString = {
  en: string;
  ar?: string;
  fr?: string;
};

export type LocalizedStringArray = {
  en: string[];
  ar?: string[];
  fr?: string[];
};

export type LocalizedValue = string | LocalizedString;
export type LocalizedArrayValue = string[] | LocalizedStringArray;

export function isLocalizedString(value: unknown): value is LocalizedString {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.en === "string";
}

export function isLocalizedStringArray(value: unknown): value is LocalizedStringArray {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.en) && obj.en.every((item) => typeof item === "string");
}

export function toLocalizedString(value: LocalizedValue): LocalizedString {
  if (isLocalizedString(value)) return value;
  return { en: value };
}

export function toLocalizedStringArray(value: LocalizedArrayValue): LocalizedStringArray {
  if (isLocalizedStringArray(value)) return value;
  return { en: value };
}

export function getLocalizedString(
  value: LocalizedValue,
  locale: string,
  fallbackLocale: CmsLocale = "en",
): string {
  const localized = toLocalizedString(value);
  const localizedValue = localized[locale as CmsLocale];
  if (typeof localizedValue === "string" && localizedValue.trim().length > 0) return localizedValue;
  const fallback = localized[fallbackLocale];
  return typeof fallback === "string" ? fallback : "";
}

export function getLocalizedStringArray(
  value: LocalizedArrayValue,
  locale: string,
  fallbackLocale: CmsLocale = "en",
): string[] {
  const localized = toLocalizedStringArray(value);
  const localizedValue = localized[locale as CmsLocale];
  if (Array.isArray(localizedValue)) return localizedValue;
  return Array.isArray(localized[fallbackLocale]) ? localized[fallbackLocale] : [];
}

export function updateLocalizedString(
  source: LocalizedValue,
  locale: CmsLocale,
  nextValue: string,
): LocalizedString {
  return {
    ...toLocalizedString(source),
    [locale]: nextValue,
  };
}

export function updateLocalizedStringArray(
  source: LocalizedArrayValue,
  locale: CmsLocale,
  nextValue: string[],
): LocalizedStringArray {
  return {
    ...toLocalizedStringArray(source),
    [locale]: nextValue,
  };
}
