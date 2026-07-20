import { describe, expect, it } from "vitest";
import { fromBackendDateAndTime, fromBackendDateTime, parseFrontendDatetime, toBackendDateTime } from "../datetime";

describe("wheels-public/datetime", () => {
  describe("fromBackendDateTime — Asia/Beirut local → ISO UTC", () => {
    it("converts winter time (UTC+2)", () => {
      // 2026-01-15 10:00 Beirut == 08:00 UTC (no DST in January)
      expect(fromBackendDateTime("2026-01-15 10:00")).toBe("2026-01-15T08:00:00.000Z");
    });

    it("converts summer time (UTC+3, EEST)", () => {
      // 2026-07-15 10:00 Beirut == 07:00 UTC (DST active in July)
      expect(fromBackendDateTime("2026-07-15 10:00")).toBe("2026-07-15T07:00:00.000Z");
    });

    it("accepts the response format with seconds", () => {
      expect(fromBackendDateTime("2027-04-15 10:00:00")).toBe("2027-04-15T07:00:00.000Z");
    });

    it("accepts the ISO-style space-or-T separator", () => {
      expect(fromBackendDateTime("2026-01-15T10:00")).toBe("2026-01-15T08:00:00.000Z");
    });

    it("throws on garbage input", () => {
      expect(() => fromBackendDateTime("tomorrow 10am")).toThrow(/Invalid backend datetime/);
      expect(() => fromBackendDateTime("")).toThrow();
    });

    it("round-trips cleanly across DST boundaries", () => {
      // Beirut DST switches at 00:00 on the last Sunday in March/October.
      // Pick a safe instant on either side.
      const cases = [
        "2026-03-26 10:00", // before DST start
        "2026-04-02 10:00", // after DST start
        "2026-10-22 10:00", // before DST end
        "2026-11-05 10:00", // after DST end
      ];
      for (const c of cases) {
        const iso = fromBackendDateTime(c);
        const back = toBackendDateTime(iso);
        expect(back).toBe(c);
      }
    });
  });

  describe("toBackendDateTime — ISO UTC → Asia/Beirut local", () => {
    it("formats winter UTC into Beirut wall time", () => {
      expect(toBackendDateTime("2026-01-15T08:00:00.000Z")).toBe("2026-01-15 10:00");
    });

    it("formats summer UTC into EEST wall time", () => {
      expect(toBackendDateTime("2026-07-15T07:00:00.000Z")).toBe("2026-07-15 10:00");
    });

    it("accepts a Date instance", () => {
      const d = new Date("2026-01-15T08:00:00.000Z");
      expect(toBackendDateTime(d)).toBe("2026-01-15 10:00");
    });

    it("throws on invalid input", () => {
      expect(() => toBackendDateTime("not a date")).toThrow(/Invalid datetime/);
    });

    it("never emits seconds (matches PDF request format)", () => {
      expect(toBackendDateTime("2026-01-15T08:34:56.789Z")).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
      );
    });

    it("treats SearchBar YYYY-MM-DDTHH:mm as Beirut wall clock (server-TZ independent)", () => {
      expect(toBackendDateTime("2026-07-21T10:00")).toBe("2026-07-21 10:00");
      expect(toBackendDateTime("2026-07-24T14:30")).toBe("2026-07-24 14:30");
    });

    it("parseFrontendDatetime converts bare T format to ISO UTC", () => {
      expect(parseFrontendDatetime("2026-07-15T10:00")).toBe("2026-07-15T07:00:00.000Z");
    });
  });

  describe("fromBackendDateAndTime — split date + time fields", () => {
    it("composes date + time and converts to ISO", () => {
      expect(fromBackendDateAndTime("2027-04-15", "10:00:00")).toBe("2027-04-15T07:00:00.000Z");
    });

    it("tolerates whitespace around the inputs", () => {
      expect(fromBackendDateAndTime("  2027-04-15  ", "  10:00  ")).toBe(
        "2027-04-15T07:00:00.000Z",
      );
    });
  });
});
