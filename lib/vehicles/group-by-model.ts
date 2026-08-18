import type { Vehicle } from "@/types/domain";

/**
 * Group key for merging individual inventory units into one bookable model.
 * Units without a model stay distinct (fallback id).
 */
export function modelGroupKey(make: string, model: string, fallbackId: string): string {
  const brand = make.trim().toLowerCase();
  const name = model.trim().toLowerCase();
  if (!name) return fallbackId;
  return `${brand}|${name}`;
}

export type FleetModelGroup = {
  vehicle: Vehicle;
  unitCount: number;
};

function preferRepresentative(current: Vehicle, next: Vehicle): Vehicle {
  if (next.images.length !== current.images.length) {
    return next.images.length > current.images.length ? next : current;
  }
  if (next.dailyRateFromCents !== current.dailyRateFromCents) {
    return next.dailyRateFromCents < current.dailyRateFromCents ? next : current;
  }
  return current;
}

/** One model per make+model, with how many inventory units it represents. */
export function groupFleetModels(vehicles: Vehicle[]): FleetModelGroup[] {
  const byKey = new Map<string, FleetModelGroup>();
  for (const vehicle of vehicles) {
    const key = modelGroupKey(vehicle.make, vehicle.model, vehicle.id);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { vehicle, unitCount: 1 });
      continue;
    }
    existing.unitCount += 1;
    existing.vehicle = preferRepresentative(existing.vehicle, vehicle);
  }
  return [...byKey.values()];
}

/** One vehicle per make+model, keeping first-seen order. */
export function groupVehiclesByModel(vehicles: Vehicle[]): Vehicle[] {
  return groupFleetModels(vehicles).map((group) => group.vehicle);
}
