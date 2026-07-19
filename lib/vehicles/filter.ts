import type { Cents, FuelType, Transmission, Vehicle, VehicleCategory } from "@/types/domain";

/**
 * Fleet-browse filter logic per 02_fleet_browse.md §4. Shared by the listing
 * page and unit tests.
 *
 * Pagination is fixed at 24/page in the spec; we accept it as an input so
 * tests can use smaller windows.
 */

export type SortKey = "recommended" | "price-asc" | "price-desc" | "newest" | "largest";

export interface FleetFilters {
  /** Multi-select; empty array = no constraint. */
  categories: VehicleCategory[];
  /** "any" = no constraint. */
  transmission: Transmission | "any";
  /** Multi-select; empty = no constraint. */
  fuels: FuelType[];
  /** Seats bucket: "2", "4-5", "6-7", "8+", or null. */
  seats: "2" | "4-5" | "6-7" | "8+" | null;
  /** Price in dollars (not cents) for URL friendliness. */
  minPriceUsd: number;
  maxPriceUsd: number;
  /** Multi-select feature filter (matches against `vehicle.features`). */
  features: string[];
  sort: SortKey;
  page: number;
  perPage: number;
}

export const DEFAULT_FILTERS: FleetFilters = {
  categories: [],
  transmission: "any",
  fuels: [],
  seats: null,
  minPriceUsd: 0,
  maxPriceUsd: 200,
  features: [],
  sort: "recommended",
  page: 1,
  perPage: 24,
};

/** Parse filters out of URL searchParams. Unknown values fall back to defaults. */
export function parseFiltersFromSearch(
  search: URLSearchParams | Record<string, string | string[] | undefined>,
  defaults: FleetFilters = DEFAULT_FILTERS,
  /** Category locked by route (e.g. /vehicles/economy). Always takes precedence. */
  routeCategory?: VehicleCategory,
): FleetFilters {
  const get = (k: string): string | undefined => {
    if (search instanceof URLSearchParams) return search.get(k) ?? undefined;
    const v = (search as Record<string, string | string[] | undefined>)[k];
    return Array.isArray(v) ? v.join(",") : v;
  };

  const splitCsv = (v: string | undefined): string[] =>
    v
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const cats = routeCategory ? [routeCategory] : (splitCsv(get("category")) as VehicleCategory[]);
  const fuels = splitCsv(get("fuel")) as FuelType[];
  const features = splitCsv(get("features"));
  const trans = get("trans");

  return {
    categories: cats,
    transmission: trans === "automatic" || trans === "manual" ? trans : "any",
    fuels,
    seats: ((): FleetFilters["seats"] => {
      const v = get("seats");
      return v === "2" || v === "4-5" || v === "6-7" || v === "8+" ? v : null;
    })(),
    minPriceUsd: Number(get("minPrice") ?? defaults.minPriceUsd),
    maxPriceUsd: Number(get("maxPrice") ?? defaults.maxPriceUsd),
    features,
    sort: ((): SortKey => {
      const v = get("sort");
      const allowed: SortKey[] = ["recommended", "price-asc", "price-desc", "newest", "largest"];
      return allowed.includes(v as SortKey) ? (v as SortKey) : defaults.sort;
    })(),
    page: Math.max(1, Number(get("page") ?? defaults.page)),
    perPage: defaults.perPage,
  };
}

/** Build a URLSearchParams from filters, omitting defaults so URLs stay short. */
export function filtersToSearch(
  filters: FleetFilters,
  defaults = DEFAULT_FILTERS,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.categories.length) params.set("category", filters.categories.join(","));
  if (filters.transmission !== defaults.transmission) params.set("trans", filters.transmission);
  if (filters.fuels.length) params.set("fuel", filters.fuels.join(","));
  if (filters.seats) params.set("seats", filters.seats);
  if (filters.minPriceUsd !== defaults.minPriceUsd)
    params.set("minPrice", String(filters.minPriceUsd));
  if (filters.maxPriceUsd !== defaults.maxPriceUsd)
    params.set("maxPrice", String(filters.maxPriceUsd));
  if (filters.features.length) params.set("features", filters.features.join(","));
  if (filters.sort !== defaults.sort) params.set("sort", filters.sort);
  if (filters.page !== defaults.page) params.set("page", String(filters.page));
  return params;
}

const priceUsd = (cents: Cents) => cents / 100;

/** Apply all filters to the fleet. */
export function applyFilters(vehicles: Vehicle[], filters: FleetFilters): Vehicle[] {
  return vehicles.filter((v) => {
    if (filters.categories.length && !filters.categories.includes(v.category)) return false;
    if (filters.transmission !== "any" && v.transmission !== filters.transmission) return false;
    if (filters.fuels.length && !filters.fuels.includes(v.fuel)) return false;
    if (filters.seats === "2" && v.seats > 2) return false;
    if (filters.seats === "4-5" && (v.seats < 4 || v.seats > 5)) return false;
    if (filters.seats === "6-7" && (v.seats < 6 || v.seats > 7)) return false;
    if (filters.seats === "8+" && v.seats < 8) return false;
    if (priceUsd(v.dailyRateFromCents) < filters.minPriceUsd) return false;
    if (priceUsd(v.dailyRateFromCents) > filters.maxPriceUsd) return false;
    if (
      filters.features.length &&
      !filters.features.every((f) =>
        v.features.map((x) => x.toLowerCase()).includes(f.toLowerCase()),
      )
    )
      return false;
    return true;
  });
}

export function sortFiltered(vehicles: Vehicle[], sort: SortKey): Vehicle[] {
  const copy = [...vehicles];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.dailyRateFromCents - b.dailyRateFromCents);
    case "price-desc":
      return copy.sort((a, b) => b.dailyRateFromCents - a.dailyRateFromCents);
    case "newest":
      return copy.sort((a, b) => b.year - a.year);
    case "largest":
      return copy.sort((a, b) => b.seats - a.seats);
    case "recommended":
    default:
      // Lowest-priced popular categories first.
      return copy.sort((a, b) => {
        const popularA = a.badge === "popular" ? 0 : 1;
        const popularB = b.badge === "popular" ? 0 : 1;
        if (popularA !== popularB) return popularA - popularB;
        return a.dailyRateFromCents - b.dailyRateFromCents;
      });
  }
}

export interface FleetFacets {
  category: Record<string, number>;
  transmission: Record<string, number>;
  fuel: Record<string, number>;
  seats: Record<string, number>;
  features: Record<string, number>;
}

/** Counts per facet against the full fleet (not the current filter result). */
export function computeFacets(vehicles: Vehicle[]): FleetFacets {
  const result: FleetFacets = {
    category: {},
    transmission: {},
    fuel: {},
    seats: {},
    features: {},
  };
  for (const v of vehicles) {
    result.category[v.category] = (result.category[v.category] ?? 0) + 1;
    result.transmission[v.transmission] = (result.transmission[v.transmission] ?? 0) + 1;
    result.fuel[v.fuel] = (result.fuel[v.fuel] ?? 0) + 1;
    const bucket = v.seats <= 2 ? "2" : v.seats <= 5 ? "4-5" : v.seats <= 7 ? "6-7" : "8+";
    result.seats[bucket] = (result.seats[bucket] ?? 0) + 1;
    for (const feature of v.features) {
      result.features[feature] = (result.features[feature] ?? 0) + 1;
    }
  }
  return result;
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage;
  return items.slice(start, start + perPage);
}
