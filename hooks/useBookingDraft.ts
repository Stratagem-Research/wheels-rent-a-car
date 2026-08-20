"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import type { BookingDraft, BookingExtra, BookingPickup, BookingReturn } from "@/types/domain";

/**
 * Booking draft state per 00_global.md §20.
 *
 *   sessionStorage key: `wheels.booking.draft`
 *
 * - Survives page refresh during the funnel (steps 1–4).
 * - Auto-clears 24h after the last write, or on explicit `clear()`.
 * - SSR-safe: returns null until the first client mount completes.
 *
 * The hook intentionally avoids React Context. The funnel is short-lived,
 * pages re-mount when navigating, and each page reads + writes the same key.
 * Multiple components on the same page get fresh reads via the `storage`
 * event + a tick-counter, which works without prop-drilling a provider.
 */

const STORAGE_KEY = "wheels.booking.draft";
const TTL_MS = 24 * 60 * 60 * 1000;

interface StoredDraft {
  draft: BookingDraft;
  ts: number;
}

function defaultDraft(now: Date = new Date()): BookingDraft {
  return {
    pickup: {
      type: "branch",
      locationId: "br-hazmieh",
      datetime: `${format(addDays(now, 1), "yyyy-MM-dd")}T10:00`,
    },
    return: {
      locationId: "br-hazmieh",
      datetime: `${format(addDays(now, 4), "yyyy-MM-dd")}T10:00`,
    },
    extras: [],
    marketingConsent: false,
    whatsappOptIn: true,
  };
}

function readStored(): BookingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.draft;
  } catch {
    return null;
  }
}

function writeStored(draft: BookingDraft) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDraft = { draft, ts: Date.now() };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // Notify cross-component listeners on the same tab (storage events don't
    // fire within the originating tab).
    window.dispatchEvent(new CustomEvent("wheels:booking-draft"));
  } catch {
    // ignore
  }
}

export function clearBookingDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("wheels:booking-draft"));
}

export interface UseBookingDraftReturn {
  /** null during SSR + initial mount; populated thereafter. */
  draft: BookingDraft | null;
  setDraft: (next: BookingDraft | ((prev: BookingDraft) => BookingDraft)) => void;
  setPickup: (pickup: BookingPickup) => void;
  setReturn: (ret: BookingReturn) => void;
  setVehicle: (
    vehicleId: string,
    rate: { type: "best-price" | "flexible"; mileage: "capped-200km" | "unlimited" },
  ) => void;
  upsertExtra: (extra: BookingExtra) => void;
  removeExtra: (addOnId: string) => void;
  setProtection: (tierId: string) => void;
  clear: typeof clearBookingDraft;
  /** True once we've hydrated from sessionStorage on the client. */
  ready: boolean;
}

export function useBookingDraft(): UseBookingDraftReturn {
  const [draft, setDraftState] = React.useState<BookingDraft | null>(null);
  const [ready, setReady] = React.useState(false);

  // Hydrate from sessionStorage on mount; subscribe to in-tab updates.
  React.useEffect(() => {
    const sync = () => {
      const stored = readStored();
      setDraftState(stored ?? defaultDraft());
      setReady(true);
    };
    sync();
    window.addEventListener("wheels:booking-draft", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wheels:booking-draft", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setDraft = React.useCallback(
    (next: BookingDraft | ((prev: BookingDraft) => BookingDraft)) => {
      // Read + write sessionStorage synchronously so a follow-up router.push
      // (e.g. vehicle confirm → /book/extras) cannot race the React updater.
      const base = readStored() ?? defaultDraft();
      const value = typeof next === "function" ? next(base) : next;
      writeStored(value);
      setDraftState(value);
    },
    [],
  );

  const setPickup = React.useCallback(
    (pickup: BookingPickup) => setDraft((d) => ({ ...d, pickup })),
    [setDraft],
  );

  const setReturn = React.useCallback(
    (ret: BookingReturn) => setDraft((d) => ({ ...d, return: ret })),
    [setDraft],
  );

  const setVehicle = React.useCallback(
    (
      vehicleId: string,
      rate: { type: "best-price" | "flexible"; mileage: "capped-200km" | "unlimited" },
    ) => setDraft((d) => ({ ...d, vehicle: { vehicleId, rate } })),
    [setDraft],
  );

  const upsertExtra = React.useCallback(
    (extra: BookingExtra) =>
      setDraft((d) => {
        const i = d.extras.findIndex((e) => e.addOnId === extra.addOnId);
        if (extra.qty <= 0) {
          // qty 0 removes the entry
          if (i === -1) return d;
          const next = [...d.extras];
          next.splice(i, 1);
          return { ...d, extras: next };
        }
        if (i === -1) return { ...d, extras: [...d.extras, extra] };
        const next = [...d.extras];
        next[i] = extra;
        return { ...d, extras: next };
      }),
    [setDraft],
  );

  const removeExtra = React.useCallback(
    (addOnId: string) =>
      setDraft((d) => ({ ...d, extras: d.extras.filter((e) => e.addOnId !== addOnId) })),
    [setDraft],
  );

  const setProtection = React.useCallback(
    (tierId: string) => setDraft((d) => ({ ...d, protectionTierId: tierId })),
    [setDraft],
  );

  return {
    draft,
    setDraft,
    setPickup,
    setReturn,
    setVehicle,
    upsertExtra,
    removeExtra,
    setProtection,
    clear: clearBookingDraft,
    ready,
  };
}

/** Seed the draft from URL search params if no draft exists yet. */
export function seedDraftFromSearchParams(params: URLSearchParams): BookingDraft {
  const d = defaultDraft();
  const pickupType = params.get("pickupType");
  if (
    pickupType === "airport" ||
    pickupType === "branch" ||
    pickupType === "address-delivery" ||
    pickupType === "chauffeur"
  ) {
    d.pickup.type = pickupType;
  }
  const pickupLoc = params.get("pickupLoc");
  if (pickupLoc) d.pickup.locationId = pickupLoc;
  const pickupAddr = params.get("pickupAddr");
  if (pickupAddr) d.pickup.address = pickupAddr;
  const pickupLat = params.get("pickupLat");
  if (pickupLat) d.pickup.lat = Number(pickupLat);
  const pickupLng = params.get("pickupLng");
  if (pickupLng) d.pickup.lng = Number(pickupLng);
  const pickupAt = params.get("pickupAt");
  if (pickupAt) d.pickup.datetime = pickupAt;
  const returnAt = params.get("returnAt");
  if (returnAt) d.return.datetime = returnAt;
  const returnLoc = params.get("returnLoc");
  if (returnLoc) d.return.locationId = returnLoc;
  const returnAddr = params.get("returnAddr");
  if (returnAddr) d.return.address = returnAddr;
  const promo = params.get("promo");
  if (promo) d.promoCode = promo;
  return d;
}
