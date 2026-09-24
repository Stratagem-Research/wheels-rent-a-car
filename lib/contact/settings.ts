import type { ContactSettings } from "@/types/domain";

/**
 * Seed row for `contact_settings` and the fallback used whenever the table
 * isn't provisioned or Supabase is unreachable. Admin edits at
 * /admin/contact override these everywhere.
 */
export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  phone: "05 959 860",
  whatsapp: "+961 3 337 228",
  email: "hello@wheelsrentacar.com.lb",
};

/** Digits only, no leading "+" — the shape `wa.me` expects. */
export function whatsAppDigits(number: string): string {
  return number.replace(/\D/g, "");
}

/**
 * `tel:` href derived from the display string. Keeps the leading "+" only
 * when the admin actually entered one — a local number like "05 959 860"
 * has no country code to infer, so forcing "+" on it would dial the wrong
 * number.
 */
export function telHref(number: string): string {
  const digits = whatsAppDigits(number);
  const prefix = number.trim().startsWith("+") ? "+" : "";
  return `tel:${prefix}${digits}`;
}

/**
 * `mailto:` href derived from the stored email. Trims surrounding
 * whitespace — the admin form's free-text field can pick up stray spaces.
 */
export function emailHref(email: string): string {
  return `mailto:${email.trim()}`;
}
