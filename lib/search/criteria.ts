import { addDays, format } from "date-fns";
import type { PickupType } from "@/types/domain";
import type { SearchCriteria } from "./types";

/**
 * Default search criteria — pickup defaults to our Hazmieh branch.
 *   pickupDate = today + 1 at 10:00
 *   returnDate = today + 4 at 10:00
 */
export function defaultSearchCriteria(now: Date = new Date()): SearchCriteria {
  return {
    pickup: { type: "branch", locationId: "br-hazmieh" },
    return: { sameAsPickup: true },
    pickupDate: format(addDays(now, 1), "yyyy-MM-dd"),
    pickupTime: "10:00",
    returnDate: format(addDays(now, 4), "yyyy-MM-dd"),
    returnTime: "10:00",
  };
}

/** Serialise criteria into a URL query string for the booking funnel. */
export function searchToQuery(criteria: SearchCriteria): URLSearchParams {
  const params = new URLSearchParams();
  params.set("pickupType", criteria.pickup.type);
  if (criteria.pickup.locationId) params.set("pickupLoc", criteria.pickup.locationId);
  if (criteria.pickup.address) params.set("pickupAddr", criteria.pickup.address);
  params.set("pickupAt", `${criteria.pickupDate}T${criteria.pickupTime}`);
  params.set("returnAt", `${criteria.returnDate}T${criteria.returnTime}`);
  if (!criteria.return.sameAsPickup) {
    if (criteria.return.locationId) params.set("returnLoc", criteria.return.locationId);
    if (criteria.return.address) params.set("returnAddr", criteria.return.address);
  }
  if (criteria.promoCode) params.set("promo", criteria.promoCode);
  return params;
}

function splitDateTime(iso: string): { date: string; time: string } | null {
  const [date, timePart] = iso.split("T");
  if (!date || !timePart) return null;
  const time = timePart.slice(0, 5);
  if (time.length < 5) return null;
  return { date, time };
}

/** Inverse of `searchToQuery` — null when the URL has no search window. */
export function queryToSearch(params: URLSearchParams): SearchCriteria | null {
  const pickupAt = params.get("pickupAt");
  const returnAt = params.get("returnAt");
  if (!pickupAt || !returnAt) return null;
  const pickup = splitDateTime(pickupAt);
  const ret = splitDateTime(returnAt);
  if (!pickup || !ret) return null;

  const pickupTypeParam = params.get("pickupType");
  const pickupType: PickupType =
    pickupTypeParam === "airport" ||
    pickupTypeParam === "branch" ||
    pickupTypeParam === "address-delivery" ||
    pickupTypeParam === "chauffeur"
      ? pickupTypeParam
      : "branch";

  const returnLoc = params.get("returnLoc");
  const returnAddr = params.get("returnAddr");
  const sameAsPickup = !returnLoc && !returnAddr;

  return {
    pickup: {
      type: pickupType,
      locationId: params.get("pickupLoc") ?? undefined,
      address: params.get("pickupAddr") ?? undefined,
    },
    return: {
      sameAsPickup,
      locationId: returnLoc ?? undefined,
      address: returnAddr ?? undefined,
    },
    pickupDate: pickup.date,
    pickupTime: pickup.time,
    returnDate: ret.date,
    returnTime: ret.time,
    promoCode: params.get("promo") ?? undefined,
  };
}

const VEHICLES_FILTER_KEYS = ["category", "sort", "trans", "page", "selected", "step"] as const;

/** Merge default search dates onto an existing /vehicles query (chips, selection). */
export function vehiclesQueryWithDefaultWindow(
  sp: Record<string, string | string[] | undefined>,
  now?: Date,
): URLSearchParams {
  const next = searchToQuery(defaultSearchCriteria(now));
  for (const key of VEHICLES_FILTER_KEYS) {
    const value = sp[key];
    if (typeof value === "string" && value) next.set(key, value);
  }
  return next;
}
