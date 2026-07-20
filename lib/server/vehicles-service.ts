import type { Vehicle } from "@/types/domain";
import { getPublicVehicles } from "@/lib/server/public-content";
import {
  applyFilters,
  computeFacets,
  DEFAULT_FILTERS,
  parseFiltersFromSearch,
  sortFiltered,
} from "@/lib/vehicles/filter";

export async function listVehiclesFromQuery(searchParams: URLSearchParams) {
  const vehicles = await getPublicVehicles();
  const filters = parseFiltersFromSearch(searchParams, DEFAULT_FILTERS);
  const filtered = sortFiltered(applyFilters(vehicles, filters), filters.sort);
  const start = (filters.page - 1) * filters.perPage;
  const items = filtered.slice(start, start + filters.perPage);
  const facets = computeFacets(vehicles);

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
  const vehicles = await getPublicVehicles();
  return vehicles.slice(0, limit);
}

export async function getSimilarVehicles(slug: string, limit = 6): Promise<Vehicle[]> {
  const vehicles = await getPublicVehicles();
  const seed = vehicles.find((v) => v.slug === slug);
  const items = (
    seed ? vehicles.filter((v) => v.category === seed.category && v.slug !== slug) : vehicles.slice(0, 6)
  ).slice(0, limit);
  return items;
}

export async function getLongTermPopularVehicles(limit = 6): Promise<Vehicle[]> {
  const vehicles = await getPublicVehicles();
  return vehicles.filter((v) => ["sedan", "suv"].includes(v.category)).slice(0, limit);
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  const vehicles = await getPublicVehicles();
  return vehicles.find((v) => v.slug === slug) ?? null;
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const vehicles = await getPublicVehicles();
  return vehicles.find((v) => v.id === id) ?? null;
}

export async function getLocationVehicles(_slug: string, limit = 6): Promise<Vehicle[]> {
  const vehicles = await getPublicVehicles();
  return vehicles.slice(0, limit);
}
