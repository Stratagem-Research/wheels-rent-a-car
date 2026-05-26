import type { VehicleCategory } from "@/types/domain";

/**
 * Human-readable labels for the closed `VehicleCategory` enum.
 *
 * Lives outside the components folder so utility code (filter sidebar, mock
 * fixtures, JSON-LD generators) can import it without pulling React.
 */
export const CATEGORY_LABELS: Record<VehicleCategory | "all", string> = {
  all: "All",
  economy: "Economy",
  compact: "Compact",
  sedan: "Sedan",
  suv: "SUV",
  luxury: "Luxury",
  "4x4": "4×4",
  "7-seater": "7-Seater",
  convertible: "Convertible",
};
