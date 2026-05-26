"use client";

/**
 * Admin content store — localStorage-backed CRUD for editable surfaces.
 *
 * Phase 12 ships a frontend-only admin dashboard. The admin can add/edit/
 * delete trips, itineraries, FAQ groups + entries, and corporate tiers;
 * the writes persist to localStorage under namespaced keys. Public pages
 * read from this store at render time, falling back to the seeded
 * fixtures in `lib/api/mocks/fixtures/*.ts` when no override is set.
 *
 * REPLACE BEFORE PRODUCTION:
 *   - Swap each `read*()` for a typed `fetch()` against the backend API.
 *   - Swap each `write*()` for a typed POST/PUT/DELETE.
 *   - Surface the loading + error states in the admin UI.
 *
 * The shape returned by each `read*()` MUST match the seeded fixtures so
 * components don't care whether they're reading from localStorage or the
 * default seed.
 */

import type { CorporateTier, FaqGroup, Itinerary, Trip } from "@/types/domain";
import { CORPORATE_TIERS } from "@/lib/api/mocks/fixtures/catalog";
import { FAQS, ITINERARIES, TRIPS } from "@/lib/api/mocks/fixtures/content";

const KEYS = {
  trips: "wheels.admin.trips",
  itineraries: "wheels.admin.itineraries",
  faqs: "wheels.admin.faqs",
  corporate: "wheels.admin.corporate",
} as const;

/* ── Generic read/write helpers ─────────────────────────────────────── */

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Notify same-window listeners (the cross-tab `storage` event fires
    // only on OTHER tabs, so we manually dispatch one for the active tab).
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {
    // Quota exceeded or storage disabled — silently skip; the admin form
    // will surface the failure separately if needed.
  }
}

function reset(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

/* ── Trips ──────────────────────────────────────────────────────────── */

export function readTrips(): Trip[] {
  return readJSON<Trip[]>(KEYS.trips, TRIPS);
}

export function writeTrips(items: Trip[]): void {
  writeJSON(KEYS.trips, items);
}

export function resetTrips(): void {
  reset(KEYS.trips);
}

/* ── Itineraries ────────────────────────────────────────────────────── */

export function readItineraries(): Itinerary[] {
  return readJSON<Itinerary[]>(KEYS.itineraries, ITINERARIES);
}

export function writeItineraries(items: Itinerary[]): void {
  writeJSON(KEYS.itineraries, items);
}

export function resetItineraries(): void {
  reset(KEYS.itineraries);
}

/* ── FAQs (groups with nested entries) ──────────────────────────────── */

export function readFaqs(): FaqGroup[] {
  return readJSON<FaqGroup[]>(KEYS.faqs, FAQS);
}

export function writeFaqs(items: FaqGroup[]): void {
  writeJSON(KEYS.faqs, items);
}

export function resetFaqs(): void {
  reset(KEYS.faqs);
}

/* ── Corporate tiers ────────────────────────────────────────────────── */

export function readCorporateTiers(): CorporateTier[] {
  return readJSON<CorporateTier[]>(KEYS.corporate, CORPORATE_TIERS);
}

export function writeCorporateTiers(items: CorporateTier[]): void {
  writeJSON(KEYS.corporate, items);
}

export function resetCorporateTiers(): void {
  reset(KEYS.corporate);
}

/** Convenience: clear EVERYTHING the admin has written. */
export function resetAll(): void {
  resetTrips();
  resetItineraries();
  resetFaqs();
  resetCorporateTiers();
}

/** All localStorage keys touched by the admin store. */
export const ADMIN_STORE_KEYS = KEYS;
