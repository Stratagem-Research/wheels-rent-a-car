import { describe, expect, it } from "vitest";
import {
  applyFilters,
  computeFacets,
  DEFAULT_FILTERS,
  filtersToSearch,
  paginate,
  parseFiltersFromSearch,
  sortFiltered,
} from "./filter";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";

describe("vehicles/filter", () => {
  describe("parseFiltersFromSearch", () => {
    it("returns defaults for an empty query", () => {
      expect(parseFiltersFromSearch(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
    });

    it("accepts comma-separated category and fuel lists", () => {
      const f = parseFiltersFromSearch(
        new URLSearchParams("category=economy,sedan&fuel=petrol,hybrid"),
      );
      expect(f.categories).toEqual(["economy", "sedan"]);
      expect(f.fuels).toEqual(["petrol", "hybrid"]);
    });

    it("respects a locked route category over the query string", () => {
      const f = parseFiltersFromSearch(new URLSearchParams("category=sedan"), undefined, "luxury");
      expect(f.categories).toEqual(["luxury"]);
    });

    it("clamps invalid sort to default", () => {
      expect(parseFiltersFromSearch(new URLSearchParams("sort=bogus")).sort).toBe("recommended");
    });
  });

  describe("applyFilters + sortFiltered", () => {
    it("filters by category", () => {
      const result = applyFilters(VEHICLES, { ...DEFAULT_FILTERS, categories: ["sedan"] });
      expect(result.every((v) => v.category === "sedan")).toBe(true);
    });

    it("filters by price range", () => {
      const result = applyFilters(VEHICLES, {
        ...DEFAULT_FILTERS,
        minPriceUsd: 80,
        maxPriceUsd: 130,
      });
      result.forEach((v) => {
        expect(v.dailyRateFromCents).toBeGreaterThanOrEqual(8000);
        expect(v.dailyRateFromCents).toBeLessThanOrEqual(13000);
      });
    });

    it("price-asc sort returns lowest first", () => {
      const sorted = sortFiltered(VEHICLES, "price-asc");
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]!;
        const curr = sorted[i]!;
        expect(prev.dailyRateFromCents).toBeLessThanOrEqual(curr.dailyRateFromCents);
      }
    });
  });

  describe("computeFacets", () => {
    it("counts every category across the full fleet", () => {
      const facets = computeFacets(VEHICLES);
      const totalCategories = Object.values(facets.category).reduce((a, b) => a + b, 0);
      expect(totalCategories).toBe(VEHICLES.length);
    });
  });

  describe("filtersToSearch", () => {
    it("omits defaults so URLs stay short", () => {
      const params = filtersToSearch(DEFAULT_FILTERS);
      expect(params.toString()).toBe("");
    });

    it("emits non-default filters", () => {
      const params = filtersToSearch({
        ...DEFAULT_FILTERS,
        categories: ["sedan"],
        sort: "price-asc",
        page: 2,
      });
      expect(params.get("category")).toBe("sedan");
      expect(params.get("sort")).toBe("price-asc");
      expect(params.get("page")).toBe("2");
    });
  });

  describe("paginate", () => {
    it("returns the correct slice for the requested page", () => {
      const items = Array.from({ length: 25 }, (_, i) => i);
      expect(paginate(items, 1, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(paginate(items, 3, 10)).toEqual([20, 21, 22, 23, 24]);
    });
  });
});
