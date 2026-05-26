/**
 * Enrich a public-API vehicle (id, name, vehicle_type_id, spec scalars) with
 * the marketing metadata the frontend needs (slug, images, features, year,
 * tagline) — none of which the backend exposes today.
 *
 * The enrichment cascades through three strategies in order:
 *   1. Explicit numeric → frontend slug map (`backendIdToSlug`). Curated by us
 *      once the Laravel team confirms which numeric ids correspond to which
 *      cars; populated via the optional `idMap` argument.
 *   2. Text match on the backend `name` against the frontend `model` field,
 *      case-insensitive ("MICRA" → "Micra"). Useful before the id map exists.
 *   3. Category fallback — pick the first frontend fixture whose
 *      `category` matches the backend `vehicle_type` bucket. Guarantees the
 *      funnel never renders a "broken" card while we wait for real metadata.
 *   4. Placeholder — last resort. Returns a synthetic Vehicle with a safe
 *      default photo so the card still renders without breaking the layout.
 *
 * Missing matches (strategies 3/4) emit a single warning per
 * `vehicle_type_id` per process via the `onMiss` callback (defaults to
 * `console.warn` in dev, no-op in prod). This is the signal the gap-analysis
 * doc tracks: "Backend should expose stable vehicle metadata so we can
 * decommission this enrichment layer."
 */

import type { Vehicle, VehicleCategory } from "@/types/domain";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import type { PublicVehicle } from "./schemas";

export type BackendIdToSlugMap = Readonly<Record<number, string>>;

/**
 * Empirically observed `vehicle_type` values (Phase 1 smoke pass):
 *   "small", "MEDIUM", "MEDIUM HATCHBACK", "FAMILY", "Luxury",
 *   "SMALL SUV", "4X4 7SEATS"
 * Normalize to uppercase + strip extra whitespace, then map to the
 * frontend's `VehicleCategory` enum.
 */
const VEHICLE_TYPE_TO_CATEGORY: Readonly<Record<string, VehicleCategory>> = {
  SMALL: "economy",
  "SMALL SUV": "suv",
  MEDIUM: "compact",
  "MEDIUM HATCHBACK": "compact",
  FAMILY: "sedan",
  LUXURY: "luxury",
  "4X4 7SEATS": "7-seater",
  "7 SEATS": "7-seater",
  "7-SEATER": "7-seater",
  SEDAN: "sedan",
  SUV: "suv",
};

/** Normalized backend `vehicle_type` lookup key. */
export function normalizeVehicleType(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, " ");
}

export function mapVehicleTypeToCategory(raw: string): VehicleCategory | undefined {
  return VEHICLE_TYPE_TO_CATEGORY[normalizeVehicleType(raw)];
}

const PLACEHOLDER_IMAGE = {
  url: "/images/Car Images/Untitled-design-2025-07-01T030112.627.png",
  alt: "Vehicle",
  width: 1080,
  height: 810,
} as const;

export interface EnrichVehicleOptions {
  /** Curated numeric backend id → frontend slug map. */
  idMap?: BackendIdToSlugMap;
  /** Called once per unmatched vehicle (after fallback) so callers can log. */
  onMiss?: (backend: PublicVehicle, fallbackUsed: "model" | "category" | "placeholder") => void;
}

/**
 * Resolve a frontend `Vehicle` for the given backend vehicle, using the
 * cascading strategies above. Always returns a Vehicle — never throws.
 */
export function enrichVehicle(backend: PublicVehicle, options: EnrichVehicleOptions = {}): Vehicle {
  const { idMap, onMiss } = options;

  // Strategy 1: explicit id map.
  if (idMap) {
    const slug = idMap[backend.id];
    if (slug) {
      const match = VEHICLES.find((v) => v.slug === slug);
      if (match) return match;
    }
  }

  // Strategy 2: name → model (case-insensitive).
  const nameKey = backend.name.trim().toLowerCase();
  if (nameKey) {
    const byModel = VEHICLES.find((v) => v.model.toLowerCase() === nameKey);
    if (byModel) {
      onMiss?.(backend, "model");
      return byModel;
    }
  }

  // Strategy 3: category fallback.
  const category = mapVehicleTypeToCategory(backend.vehicle_type);
  if (category) {
    const byCategory = VEHICLES.find((v) => v.category === category);
    if (byCategory) {
      onMiss?.(backend, "category");
      return byCategory;
    }
  }

  // Strategy 4: placeholder.
  onMiss?.(backend, "placeholder");
  return synthesizePlaceholder(backend, category);
}

function synthesizePlaceholder(
  backend: PublicVehicle,
  category: VehicleCategory | undefined,
): Vehicle {
  const slug = backend.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const displayName = backend.name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

  return {
    id: `wheels-${backend.id}`,
    slug: slug || `wheels-${backend.id}`,
    make: "Wheels",
    model: displayName || `Vehicle #${backend.id}`,
    year: new Date().getFullYear(),
    category: category ?? "economy",
    tagline: undefined,
    description: undefined,
    badge: null,
    transmission: backend.gearbox === "manual" ? "manual" : "automatic",
    fuel:
      backend.fuel_type === "diesel" ||
      backend.fuel_type === "hybrid" ||
      backend.fuel_type === "electric"
        ? backend.fuel_type
        : "petrol",
    seats: backend.number_of_seats,
    doors: 4,
    bags: 3,
    features: [],
    images: [PLACEHOLDER_IMAGE],
    dailyRateFromCents: Math.round(backend.pricing.daily_price * 100),
    ownsInFleet: false,
  };
}

/**
 * Module-scoped dedupe set so the default `onMiss` warner only logs once per
 * `vehicle_type_id`. Reset by the test suite via `resetEnrichmentWarnings`.
 */
const warnedTypeIds = new Set<number>();

export function defaultOnMiss(
  backend: PublicVehicle,
  fallbackUsed: "model" | "category" | "placeholder",
): void {
  if (process.env.NODE_ENV === "production") return;
  if (warnedTypeIds.has(backend.vehicle_type_id)) return;
  warnedTypeIds.add(backend.vehicle_type_id);
  console.warn(
    `[wheels-public] vehicle ${backend.id} (${backend.name}, type ${backend.vehicle_type_id}/${backend.vehicle_type}) ` +
      `fell back to "${fallbackUsed}". Consider adding a curated idMap entry.`,
  );
}

export function resetEnrichmentWarnings(): void {
  warnedTypeIds.clear();
}
