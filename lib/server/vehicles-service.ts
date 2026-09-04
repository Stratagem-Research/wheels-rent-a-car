import type { Vehicle } from "@/types/domain";
import { frontendVehicleIdFromWizard, parseWizardVehicleId } from "@/lib/booking/wizard-vehicle-id";
import { getPublicVehicles } from "@/lib/server/public-content";
import { listHeldFrontendVehicleIds } from "@/lib/supabase/vehicle-booking-holds-repository";
import {
  applyFilters,
  computeFacets,
  DEFAULT_FILTERS,
  parseFiltersFromSearch,
  sortFiltered,
} from "@/lib/vehicles/filter";
import { groupVehiclesByModel } from "@/lib/vehicles/group-by-model";

/**
 * Catalog vehicles, minus any unit currently out on an active/upcoming
 * booking (website hold — see vehicle_booking_holds). The admin fleet record
 * itself is untouched; a unit reappears here as soon as its hold is released
 * (booking cancelled or the trip ends).
 */
async function getBrowsableVehicles(): Promise<Vehicle[]> {
  const [vehicles, heldIds] = await Promise.all([
    getPublicVehicles(),
    listHeldFrontendVehicleIds(),
  ]);
  return vehicles.filter((v) => !heldIds.has(v.id));
}

export async function listVehiclesFromQuery(searchParams: URLSearchParams) {
  const vehicles = await getBrowsableVehicles();
  const filters = parseFiltersFromSearch(searchParams, DEFAULT_FILTERS);
  const filtered = sortFiltered(
    groupVehiclesByModel(applyFilters(vehicles, filters)),
    filters.sort,
  );
  const start = (filters.page - 1) * filters.perPage;
  const items = filtered.slice(start, start + filters.perPage);
  const facets = computeFacets(groupVehiclesByModel(vehicles));

  return {
    items,
    total: filtered.length,
    page: filters.page,
    perPage: filters.perPage,
    facets: {
      category: facets.category,
      transmission: facets.transmission,
      fuel: facets.fuel,
    },
  };
}

export async function getFeaturedVehicles(limit = 8): Promise<Vehicle[]> {
  const vehicles = await getBrowsableVehicles();
  return groupVehiclesByModel(vehicles).slice(0, limit);
}

export async function getSimilarVehicles(slug: string, limit = 6): Promise<Vehicle[]> {
  const vehicles = groupVehiclesByModel(await getBrowsableVehicles());
  const seed = vehicles.find((v) => v.slug === slug);
  const items = (
    seed ? vehicles.filter((v) => v.category === seed.category && v.slug !== slug) : vehicles.slice(0, 6)
  ).slice(0, limit);
  return items;
}

export async function getLongTermPopularVehicles(limit = 6): Promise<Vehicle[]> {
  const vehicles = groupVehiclesByModel(await getBrowsableVehicles());
  return vehicles.filter((v) => ["sedan", "suv"].includes(v.category)).slice(0, limit);
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  const vehicles = await getPublicVehicles();
  return vehicles.find((v) => v.slug === slug) ?? null;
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const vehicles = await getPublicVehicles();
  const direct = vehicles.find((v) => v.id === id);
  if (direct) return direct;
  const numeric = parseWizardVehicleId(id);
  if (numeric == null) return null;
  const prefixed = frontendVehicleIdFromWizard(numeric);
  return (
    vehicles.find((v) => v.id === prefixed || parseWizardVehicleId(v.id) === numeric) ?? null
  );
}

export async function getLocationVehicles(_slug: string, limit = 6): Promise<Vehicle[]> {
  const vehicles = groupVehiclesByModel(await getBrowsableVehicles());
  return vehicles.slice(0, limit);
}
