/**
 * Booking reference — the user-visible identifier of a reservation.
 *
 * Format: WRC-YYMMDD-XXXX
 *   WRC      = brand prefix
 *   YYMMDD   = creation date (UTC)
 *   XXXX     = 4-character random suffix from [A-Z2-9] (omits I, O, 0, 1
 *              to avoid the most-mistakenly-typed characters)
 *
 * Stays in JetBrains Mono everywhere it's displayed (00_global.md §16).
 */

export const BOOKING_REF_PATTERN = /^WRC-\d{6}-[A-Z0-9]{4}$/;
export const SAFE_SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isValidBookingRef(value: string): boolean {
  return BOOKING_REF_PATTERN.test(value);
}

export function generateBookingRef(date: Date = new Date()): string {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * SAFE_SUFFIX_CHARS.length);
    suffix += SAFE_SUFFIX_CHARS[idx];
  }
  return `WRC-${yy}${mm}${dd}-${suffix}`;
}
