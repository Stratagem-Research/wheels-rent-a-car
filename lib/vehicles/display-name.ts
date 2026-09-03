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

/** Sixt-style class badge: combines size class + body shape. Returns a key
 * into the `fleet` message namespace so the label localizes. */
export function bodyClassKey(v: Pick<Vehicle, "category" | "doors">): string {
  switch (v.category) {
    case "economy":
      return v.doors === 5 ? "classStandardHatch" : "classEconomySedan";
    case "compact":
      return v.doors === 5 ? "classCompactHatch" : "classCompactSedan";
    case "sedan":
      return "classStandardSedan";
    case "suv":
      return "classCompactSuv";
    case "4x4":
      return "classOffroad4x4";
    case "luxury":
      return "classLuxurySuv";
    case "7-seater":
      return "classSevenSeater";
    case "convertible":
      return "classConvertible";
    default:
      return "classStandardSedan";
  }
}
