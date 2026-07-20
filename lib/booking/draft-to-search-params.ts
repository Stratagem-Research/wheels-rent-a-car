import type { BookingDraft } from "@/types/domain";

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
