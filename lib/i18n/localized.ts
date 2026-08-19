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

function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

/**
 * CMS columns must be `{en, ar?, fr?}` maps. The 20260606 text→jsonb migration
 * wrapped already-localized JSON as `{en: "<json string>"}` or `{en: {en, ar, fr}}`.
 * Peel that wrapping so locale pickers show real copy, not raw JSON.
 */
export function toLocalizedString(value: unknown): LocalizedString {
  return unwrapLocalizedString(value, 0);
}

function unwrapLocalizedString(value: unknown, depth: number): LocalizedString {
  if (depth > 4) return { en: "" };
  const parsed = parseJsonIfString(value);
  if (!isRecord(parsed) || !("en" in parsed)) {
    return typeof parsed === "string" ? { en: parsed } : { en: "" };
  }

  const inner = parseJsonIfString(parsed.en);
  if (isRecord(inner) && typeof inner.en === "string") {
    return unwrapLocalizedString(inner, depth + 1);
  }
  if (typeof inner === "string" && inner !== parsed.en) {
    return unwrapLocalizedString(inner, depth + 1);
  }

  const pick = (key: "ar" | "fr"): string | undefined => {
    const raw = parseJsonIfString(parsed[key]);
    return typeof raw === "string" && raw.trim() ? raw : undefined;
  };

  return {
    en: typeof inner === "string" ? inner : typeof parsed.en === "string" ? parsed.en : "",
    ...(pick("ar") ? { ar: pick("ar") } : {}),
    ...(pick("fr") ? { fr: pick("fr") } : {}),
  };
}

export function toLocalizedStringArray(value: unknown): LocalizedStringArray {
  return unwrapLocalizedStringArray(value, 0);
}

function unwrapLocalizedStringArray(value: unknown, depth: number): LocalizedStringArray {
  if (depth > 4) return { en: [] };
  const parsed = parseJsonIfString(value);
  if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
    return { en: parsed };
  }
  if (!isRecord(parsed) || !("en" in parsed)) return { en: [] };

  const inner = parseJsonIfString(parsed.en);
  if (isRecord(inner) && Array.isArray(inner.en)) {
    return unwrapLocalizedStringArray(inner, depth + 1);
  }
  if (Array.isArray(inner) && inner.every((item) => typeof item === "string")) {
    const pick = (key: "ar" | "fr"): string[] | undefined => {
      const raw = parseJsonIfString(parsed[key]);
      return Array.isArray(raw) && raw.every((item) => typeof item === "string") ? raw : undefined;
    };
    return {
      en: inner,
      ...(pick("ar") ? { ar: pick("ar") } : {}),
      ...(pick("fr") ? { fr: pick("fr") } : {}),
    };
  }
  return { en: [] };
}

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
