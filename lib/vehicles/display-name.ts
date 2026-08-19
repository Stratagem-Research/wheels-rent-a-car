import type { Vehicle } from "@/types/domain";

export function composeVehicleTitle(brand: string, model: string): string {
  return [brand, model]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

/** Listing/booking label: brand + model. */
export function vehicleDisplayName(
  vehicle: Pick<Vehicle, "make" | "model" | "title">,
): string {
  return composeVehicleTitle(vehicle.make, vehicle.model) || vehicle.title?.trim() || "Vehicle";
}
