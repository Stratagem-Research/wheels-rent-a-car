export type SupportedLocale = "en" | "ar" | "fr";

export function toSupportedLocale(locale: string): SupportedLocale {
  if (locale === "ar" || locale === "fr") return locale;
  return "en";
}

export function formatDateShortByLocale(isoDate: string, locale: string): string {
  if (!isoDate) return "—";
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === now.getFullYear()
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
  return d.toLocaleDateString(normalizeLocale(locale), opts);
}

export function formatDateTimeByLocale(isoDateTime: string, locale: string): string {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return isoDateTime;
  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale !== "fr",
  }).format(d);
}

export function formatTimeByLocale(time24: string, locale: string): string {
  if (!time24) return "—";
  const [hStr = "0", mStr = "00"] = time24.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return time24;

  const d = new Date();
  d.setHours(h, parseInt(mStr, 10) || 0, 0, 0);
  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale !== "fr",
  }).format(d);
}

export function formatCountByLocale(value: number, locale: string): string {
  return new Intl.NumberFormat(normalizeLocale(locale)).format(value);
}

function normalizeLocale(locale: string): string {
  if (locale === "ar") return "ar-LB";
  if (locale === "fr") return "fr-FR";
  return "en-US";
}
