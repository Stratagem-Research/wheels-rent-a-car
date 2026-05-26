import type { ISODate, PickupType, TimeHHmm } from "@/types/domain";

/**
 * Search criteria — the persistent shape behind the global search bar.
 * Survives in localStorage as `wheels.lastSearch` for 7 days (00_global.md §4).
 *
 * The shape is intentionally simpler than the BookingDraft: it covers what
 * a user inputs to find vehicles, not the full funnel state. On "Show cars",
 * the criteria are serialised to a URL query and the funnel takes over.
 */
export interface SearchCriteria {
  pickup: {
    type: PickupType;
    /** Branch id when type === "branch" or "airport". */
    locationId?: string;
    /** Street address when type === "address-delivery". */
    address?: string;
  };
  return: {
    /** If true, ignore the rest and use pickup. */
    sameAsPickup: boolean;
    locationId?: string;
    address?: string;
  };
  pickupDate: ISODate;
  pickupTime: TimeHHmm;
  returnDate: ISODate;
  returnTime: TimeHHmm;
  promoCode?: string;
}

/** Combined ISO datetime helpers — components display these. */
export interface SearchDateTimePair {
  pickup: string;
  return: string;
}
