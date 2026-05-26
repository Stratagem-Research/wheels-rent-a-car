import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  clearLastSearch,
  defaultSearchCriteria,
  readLastSearch,
  searchToQuery,
  writeLastSearch,
} from "./persistence";

describe("search/persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to the Hazmieh branch at +1 day 10:00", () => {
    const now = new Date("2026-05-15T08:00:00.000Z");
    const c = defaultSearchCriteria(now);
    expect(c.pickup.type).toBe("branch");
    expect(c.pickup.locationId).toBe("br-hazmieh");
    expect(c.pickupTime).toBe("10:00");
    expect(c.returnTime).toBe("10:00");
  });

  it("round-trips through write/read", () => {
    const c = defaultSearchCriteria(new Date("2026-05-15T08:00:00.000Z"));
    writeLastSearch(c);
    expect(readLastSearch()).toEqual(c);
  });

  it("returns null after the 7-day TTL", () => {
    const c = defaultSearchCriteria(new Date("2026-05-15T08:00:00.000Z"));
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(
      "wheels.lastSearch",
      JSON.stringify({ criteria: c, ts: eightDaysAgo }),
    );
    expect(readLastSearch()).toBeNull();
  });

  it("clears persisted criteria", () => {
    writeLastSearch(defaultSearchCriteria(new Date()));
    clearLastSearch();
    expect(readLastSearch()).toBeNull();
  });

  it("serialises into a URL query the funnel can read", () => {
    const c = defaultSearchCriteria(new Date("2026-05-15T08:00:00.000Z"));
    c.promoCode = "SUMMER15";
    const params = searchToQuery(c);
    expect(params.get("pickupType")).toBe("branch");
    expect(params.get("pickupLoc")).toBe("br-hazmieh");
    expect(params.get("pickupAt")).toMatch(/2026-05-16T10:00/);
    expect(params.get("promo")).toBe("SUMMER15");
  });

  it("ignores localStorage errors silently", () => {
    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writeLastSearch(defaultSearchCriteria(new Date()))).not.toThrow();
    spy.mockRestore();
  });
});
