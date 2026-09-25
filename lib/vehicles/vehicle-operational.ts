import type { FuelType, Transmission, Vehicle, VehicleCategory } from "@/types/domain";
import { mapVehicleTypeToCategory } from "@/lib/api/wheels-public/vehicle-enrichment";

/** Website-owned copy of Wizard vehicle specs (manual cars). */
export type VehicleOperational = {
  name?: string | null;
  display_name?: string | null;
  year?: number | null;
  color?: string | null;
  category_name?: string | null;
  vehicle_type_id?: number | null;
  vehicle_type_name?: string | null;
  number_of_seats?: number | null;
  number_of_doors?: number | null;
  transmission?: string | null;
  gearbox?: string | null;
  fuel_type?: string | null;
  status?: string | null;
  website_enabled?: boolean | null;
  marketplace_enabled?: boolean | null;
  is_sold?: boolean | null;
  is_publicly_bookable?: boolean | null;
  daily_rate?: number | null;
  standard_price?: number | null;
  base_daily_rate?: number | null;
  currency?: string | null;
  location_name?: string | null;
  branch_name?: string | null;
  area_name?: string | null;
  wizard_status?: string | null;
};

export function emptyOperational(): VehicleOperational {
  return {
    year: new Date().getFullYear(),
    transmission: "automatic",
    gearbox: "automatic",
    fuel_type: "petrol",
    status: "available",
    website_enabled: true,
    marketplace_enabled: true,
    is_sold: false,
    is_publicly_bookable: true,
    daily_rate: 20,
    standard_price: 20,
    currency: "USD",
    number_of_seats: 4,
    number_of_doors: 4,
    category_name: "small",
    vehicle_type_name: "small",
    vehicle_type_id: 1,
  };
}

export function parseOperational(raw: unknown): VehicleOperational {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as VehicleOperational;
}

export function normalizeOperational(
  op: VehicleOperational,
  fallbackName?: string | null,
): VehicleOperational {
  const displayName =
    op.display_name?.trim() || fallbackName?.trim() || op.name?.trim() || null;
  return {
    ...op,
    name: displayName,
    display_name: displayName,
    gearbox: op.transmission ?? op.gearbox,
    standard_price: op.daily_rate ?? op.standard_price,
    base_daily_rate: op.daily_rate ?? op.base_daily_rate,
    vehicle_type_name: op.category_name || op.vehicle_type_name,
    wizard_status: op.status ?? op.wizard_status,
    branch_name: op.branch_name || op.location_name,
    area_name: op.area_name || op.location_name,
  };
}

/** Website-owned hide: stays in admin, omitted from /vehicles until turned back on. */
export function isHiddenFromVehiclesPage(operational: VehicleOperational): boolean {
  return operational.website_enabled === false;
}

export function isManualVehiclePublic(operational: VehicleOperational): boolean {
  if (operational.is_sold === true) return false;
  if (isHiddenFromVehiclesPage(operational)) return false;
  if (operational.is_publicly_bookable === false) return false;
  return true;
}

function asTransmission(raw: string | null | undefined): Transmission {
  return raw === "manual" ? "manual" : "automatic";
}

function asFuel(raw: string | null | undefined): FuelType {
  if (raw === "diesel" || raw === "hybrid" || raw === "electric") return raw;
  return "petrol";
}

export function categoryFromOperational(operational: VehicleOperational): VehicleCategory {
  const raw = operational.category_name || operational.vehicle_type_name;
  if (raw) {
    const mapped = mapVehicleTypeToCategory(raw);
    if (mapped) return mapped;
  }
  return "economy";
}

/** Website `daily_rate` is stored in USD; public vehicles use cents. */
export function dailyRateCentsFromOperational(
  operational: VehicleOperational,
  fallbackCents: number,
): number {
  return typeof operational.daily_rate === "number" && operational.daily_rate > 0
    ? Math.round(operational.daily_rate * 100)
    : fallbackCents;
}

export function applyOperationalSpecs(
  vehicle: Vehicle,
  operational: VehicleOperational,
): Vehicle {
  const seats =
    typeof operational.number_of_seats === "number" && operational.number_of_seats > 0
      ? operational.number_of_seats
      : vehicle.seats;
  const doors =
    typeof operational.number_of_doors === "number" && operational.number_of_doors > 0
      ? operational.number_of_doors
      : vehicle.doors;
  const dailyRate = dailyRateCentsFromOperational(operational, vehicle.dailyRateFromCents);
  const year =
    typeof operational.year === "number" && operational.year > 1900
      ? operational.year
      : vehicle.year;
  return {
    ...vehicle,
    year,
    category: categoryFromOperational(operational),
    transmission: asTransmission(operational.gearbox ?? operational.transmission),
    fuel: asFuel(operational.fuel_type),
    seats,
    doors,
    dailyRateFromCents: dailyRate,
  };
}
