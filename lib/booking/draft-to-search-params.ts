import type { BookingDraft } from "@/types/domain";

/** SearchBar / funnel keys carried across step navigation. */
export const BOOKING_SEARCH_PARAM_KEYS = [
  "pickupType",
  "pickupLoc",
  "pickupAddr",
  "pickupAt",
  "returnAt",
  "returnLoc",
  "returnAddr",
  "promo",
] as const;

/** Copy search context from one URLSearchParams into another (e.g. /vehicles → /book/extras). */
export function appendSearchContextFromParams(
  target: URLSearchParams,
  source: URLSearchParams,
): void {
  for (const key of BOOKING_SEARCH_PARAM_KEYS) {
    const value = source.get(key);
    if (value) target.set(key, value);
  }
}

/** Rebuild funnel search URL params from a booking draft (409 recovery redirect). */
export function draftToSearchParams(draft: BookingDraft): URLSearchParams {
  const params = new URLSearchParams();
  params.set("step", "1");
  params.set("pickupType", draft.pickup.type);
  if (draft.pickup.locationId) params.set("pickupLoc", draft.pickup.locationId);
  if (draft.pickup.address) params.set("pickupAddr", draft.pickup.address);
  params.set("pickupAt", draft.pickup.datetime);
  params.set("returnAt", draft.return.datetime);
  if (draft.return.locationId) params.set("returnLoc", draft.return.locationId);
  if (draft.return.address) params.set("returnAddr", draft.return.address);
  if (draft.promoCode) params.set("promo", draft.promoCode);
  return params;
}
