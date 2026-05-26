"use client";

import { addDays, format } from "date-fns";
import type { SearchCriteria } from "./types";

const STORAGE_KEY = "wheels.lastSearch";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

interface StoredCriteria {
  criteria: SearchCriteria;
  ts: number;
}

export function readLastSearch(): SearchCriteria | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredCriteria;
    if (Date.now() - stored.ts > TTL_MS) return null;
    return stored.criteria;
  } catch {
    return null;
  }
}

export function writeLastSearch(criteria: SearchCriteria): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredCriteria = { criteria, ts: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable in private modes — fall through silently.
  }
}

export function clearLastSearch(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
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
