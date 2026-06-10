import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Vehicle } from "@/types/domain";

/** Resolve vehicle cards for a set of frontend ids from the fleet catalog API. */
export async function fetchVehiclesByIds(ids: string[]): Promise<Vehicle[]> {
  if (ids.length === 0) return [];

  const res = await api.get<{ items: Vehicle[] }>(`${endpoints.vehicles}?perPage=100`);
  const wanted = new Set(ids);
  const byId = new Map(res.items.filter((vehicle) => wanted.has(vehicle.id)).map((v) => [v.id, v]));

  // Preserve wishlist order from the saved-ids list.
  return ids.map((id) => byId.get(id)).filter((v): v is Vehicle => Boolean(v));
}
