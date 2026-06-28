import type { PromoCodeRow } from "@/lib/supabase/promo-codes-repository";

export type PromoValidationResult =
  | { valid: true; code: string; discountPercent: number }
  | { valid: false; code: string; reason: string };

/** Validate a promo code against website-owned rules (Supabase row or known fallback). */
export function validatePromoCodeFromRow(
  code: string | undefined,
  row: PromoCodeRow | null,
  now = Date.now(),
): PromoValidationResult | null {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return null;

  if (!row || !row.active) {
    return { valid: false, code: normalized, reason: "Invalid or expired promo code." };
  }

  const startsAt = row.starts_at ? Date.parse(row.starts_at) : null;
  const endsAt = row.ends_at ? Date.parse(row.ends_at) : null;
  if (startsAt && startsAt > now) {
    return { valid: false, code: normalized, reason: "This promo code is not active yet." };
  }
  if (endsAt && endsAt < now) {
    return { valid: false, code: normalized, reason: "This promo code has expired." };
  }

  return {
    valid: true,
    code: normalized,
    discountPercent: Number(row.discount_percent),
  };
}

export function promoDiscountCents(subtotalCents: number, discountPercent: number): number {
  if (subtotalCents <= 0 || discountPercent <= 0) return 0;
  return Math.round(subtotalCents * (discountPercent / 100));
}
