import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultOnMiss,
  enrichVehicle,
  mapVehicleTypeToCategory,
  normalizeVehicleType,
  resetEnrichmentWarnings,
} from "../vehicle-enrichment";
import type { PublicVehicle } from "../schemas";
import { VEHICLES } from "@/lib/api/fixtures/vehicles";

function publicVehicle(overrides: Partial<PublicVehicle> = {}): PublicVehicle {
  return {
    id: 131,
    name: "MICRA",
    model: "MICRA",
    license_plate: null,
    vehicle_type_id: 1,
    vehicle_type: "small",
    gearbox: "automatic",
    fuel_type: "petrol",
    number_of_seats: 4,
    is_available: true,
    unavailable_reason: null,
    pricing: {
      days: 4,
      price_option: "standard",
      price_label: "Standard Price",
      daily_price: 20,
      total: 80,
    },
    ...overrides,
  };
}

describe("wheels-public/vehicle-enrichment", () => {
  afterEach(() => {
    resetEnrichmentWarnings();
  });

  describe("normalizeVehicleType", () => {
    it("uppercases and collapses whitespace", () => {
      expect(normalizeVehicleType("  small  ")).toBe("SMALL");
      expect(normalizeVehicleType("medium hatchback")).toBe("MEDIUM HATCHBACK");
      expect(normalizeVehicleType("4X4   7SEATS")).toBe("4X4 7SEATS");
    });
  });

  describe("mapVehicleTypeToCategory", () => {
    it("maps the live variants observed in Phase 1", () => {
      expect(mapVehicleTypeToCategory("small")).toBe("economy");
      expect(mapVehicleTypeToCategory("MEDIUM")).toBe("compact");
      expect(mapVehicleTypeToCategory("MEDIUM HATCHBACK")).toBe("compact");
      expect(mapVehicleTypeToCategory("FAMILY")).toBe("sedan");
      expect(mapVehicleTypeToCategory("Luxury")).toBe("luxury");
      expect(mapVehicleTypeToCategory("SMALL SUV")).toBe("suv");
      expect(mapVehicleTypeToCategory("4X4 7SEATS")).toBe("7-seater");
    });

    it("returns undefined for unknown types", () => {
      expect(mapVehicleTypeToCategory("convertible-coupe")).toBeUndefined();
    });
  });

  describe("enrichVehicle", () => {
    it("strategy 1: uses the explicit idMap when provided", () => {
      const result = enrichVehicle(publicVehicle({ id: 131 }), {
        idMap: { 131: "kia-cerato" },
      });
      expect(result.slug).toBe("kia-cerato");
    });

    it("strategy 2: falls back to a model-name match", () => {
      // Map a backend vehicle to a frontend model by name (case-insensitive).
      const onMiss = vi.fn();
      const result = enrichVehicle(publicVehicle({ name: "yaris", id: 999 }), { onMiss });
      expect(result.slug).toBe("toyota-yaris");
      expect(onMiss).toHaveBeenCalledWith(expect.objectContaining({ id: 999 }), "model");
    });

    it("strategy 3: keeps Wizard name when falling back to category photos", () => {
      const onMiss = vi.fn();
      const result = enrichVehicle(publicVehicle({ name: "NoSuchModel", vehicle_type: "small" }), {
        onMiss,
      });
      expect(result.category).toBe("economy");
      expect(result.make).toBe("Nosuchmodel");
      expect(result.make).not.toBe("Toyota");
      expect(result.model).not.toBe("Yaris");
      expect(onMiss).toHaveBeenCalledWith(expect.anything(), "category");
    });

    it("strategy 4: synthesizes a placeholder if no category match", () => {
      const onMiss = vi.fn();
      const result = enrichVehicle(
        publicVehicle({ name: "MysteryCar", vehicle_type: "convertible-coupe" }),
        { onMiss },
      );
      expect(result.make).toBe("Wheels");
      expect(result.images[0]?.url).toMatch(/Car Images/);
      expect(onMiss).toHaveBeenCalledWith(expect.anything(), "placeholder");
    });

    it("placeholder respects backend seats / gearbox / fuel hints", () => {
      const result = enrichVehicle(
        publicVehicle({
          name: "UniqueCar",
          vehicle_type: "convertible-coupe",
          number_of_seats: 2,
          gearbox: "manual",
          fuel_type: "hybrid",
        }),
      );
      expect(result.seats).toBe(2);
      expect(result.transmission).toBe("manual");
      expect(result.fuel).toBe("hybrid");
    });

    it("explicit idMap overrides name and category matches", () => {
      const onMiss = vi.fn();
      const result = enrichVehicle(publicVehicle({ name: "yaris" }), {
        idMap: { 131: "chevrolet-tahoe" },
        onMiss,
      });
      expect(result.slug).toBe("chevrolet-tahoe");
      expect(onMiss).not.toHaveBeenCalled();
    });
  });

  describe("defaultOnMiss", () => {
    it("warns once per vehicle_type_id (dev only)", () => {
      vi.stubEnv("NODE_ENV", "development");
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        defaultOnMiss(publicVehicle({ id: 1, vehicle_type_id: 5 }), "category");
        defaultOnMiss(publicVehicle({ id: 2, vehicle_type_id: 5 }), "category");
        defaultOnMiss(publicVehicle({ id: 3, vehicle_type_id: 6 }), "placeholder");
        expect(warn).toHaveBeenCalledTimes(2);
      } finally {
        warn.mockRestore();
        vi.unstubAllEnvs();
      }
    });

    it("is silent in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        defaultOnMiss(publicVehicle(), "placeholder");
        expect(warn).not.toHaveBeenCalled();
      } finally {
        warn.mockRestore();
        vi.unstubAllEnvs();
      }
    });
  });

  // Belt-and-suspenders sanity: the curated fixtures referenced by the
  // strategy tests still exist. If the fleet ever changes, this catches it.
  it("fixture sanity: kia-cerato, toyota-yaris, chevrolet-tahoe slugs present", () => {
    const slugs = VEHICLES.map((v) => v.slug);
    expect(slugs).toContain("kia-cerato");
    expect(slugs).toContain("toyota-yaris");
    expect(slugs).toContain("chevrolet-tahoe");
  });
});
