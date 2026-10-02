import { beforeEach, describe, expect, it } from "vitest";
import { ApiError, WheelsNetworkError } from "@/lib/api/wheels-public/client";
import {
  guardBookingLookup,
  isLookupMiss,
  resetBookingLookupGuard,
} from "@/lib/server/booking-lookup-guard";

const req = (ip: string) =>
  new Request("http://localhost/api/booking/lookup", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });

const REF = "WRC-260520-9KQ4";
const EMAIL = "victim@example.com";

/** Records `count` misses for the pair as if sent from `ip`. */
function miss(ip: string, count: number, ref: string = REF, email: string = EMAIL) {
  for (let i = 0; i < count; i += 1) guardBookingLookup(req(ip), { ref, email }).fail();
}

describe("booking-lookup-guard", () => {
  beforeEach(() => {
    resetBookingLookupGuard();
  });

  it("lets an untouched client through", () => {
    expect(guardBookingLookup(req("1.1.1.1"), { ref: REF, email: EMAIL }).blocked).toBeNull();
  });

  it("blocks a known email after 8 wrong refs, even from fresh IPs each time", () => {
    // The realistic attack: guess the ref suffix for a known customer email,
    // rotating the source address every request.
    for (let i = 0; i < 8; i += 1) {
      guardBookingLookup(req(`10.0.0.${i}`), { ref: `WRC-260520-AAA${i}`, email: EMAIL }).fail();
    }
    const next = guardBookingLookup(req("10.0.1.1"), { ref: "WRC-260520-ZZZZ", email: EMAIL });
    expect(next.blocked?.status).toBe(429);
  });

  it("blocks a known ref after 8 wrong emails, even from fresh IPs each time", () => {
    for (let i = 0; i < 8; i += 1) {
      guardBookingLookup(req(`10.0.0.${i}`), { ref: REF, email: `guess${i}@example.com` }).fail();
    }
    const next = guardBookingLookup(req("10.0.1.1"), { ref: REF, email: "another@example.com" });
    expect(next.blocked?.status).toBe(429);
  });

  it("blocks one IP spraying random pairs after 15 misses", () => {
    for (let i = 0; i < 15; i += 1) {
      guardBookingLookup(req("9.9.9.9"), { ref: `WRC-260520-B${i}XX`, email: `u${i}@example.com` }).fail();
    }
    const next = guardBookingLookup(req("9.9.9.9"), { ref: "WRC-260520-QQQQ", email: "new@example.com" });
    expect(next.blocked?.status).toBe(429);
    // A different source with different pairs is unaffected.
    expect(guardBookingLookup(req("8.8.8.8"), { ref: "WRC-260520-RRRR", email: "ok@example.com" }).blocked).toBeNull();
  });

  it("sends a Retry-After for the longest lockout", () => {
    miss("1.1.1.1", 8);
    const blocked = guardBookingLookup(req("2.2.2.2"), { ref: REF, email: EMAIL }).blocked;
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("treats ref case and email case/whitespace as the same key", () => {
    for (let i = 0; i < 8; i += 1) {
      guardBookingLookup(req(`10.0.0.${i}`), {
        ref: " wrc-260520-9kq4 ",
        email: ` ${EMAIL.toUpperCase()} `,
      }).fail();
    }
    expect(guardBookingLookup(req("5.5.5.5"), { ref: REF, email: EMAIL }).blocked?.status).toBe(429);
  });

  it("forgives earlier typos once the pair matches", () => {
    miss("1.1.1.1", 7);
    guardBookingLookup(req("1.1.1.1"), { ref: REF, email: EMAIL }).succeed();
    miss("3.3.3.3", 7);
    expect(guardBookingLookup(req("4.4.4.4"), { ref: REF, email: EMAIL }).blocked).toBeNull();
  });

  it("does not let a success reset the IP counter", () => {
    // One source can't dodge its cap by interleaving a lookup it owns.
    for (let i = 0; i < 14; i += 1) {
      guardBookingLookup(req("7.7.7.7"), { ref: `WRC-260520-C${i}XX`, email: `u${i}@example.com` }).fail();
    }
    guardBookingLookup(req("7.7.7.7"), { ref: "WRC-260520-MINE", email: "mine@example.com" }).succeed();
    guardBookingLookup(req("7.7.7.7"), { ref: "WRC-260520-NOPE", email: "x@example.com" }).fail();
    expect(
      guardBookingLookup(req("7.7.7.7"), { ref: "WRC-260520-LAST", email: "y@example.com" }).blocked?.status,
    ).toBe(429);
  });

  it("still throttles by IP when the body has no usable ref or email", () => {
    for (let i = 0; i < 15; i += 1) guardBookingLookup(req("6.6.6.6"), {}).fail();
    expect(guardBookingLookup(req("6.6.6.6"), {}).blocked?.status).toBe(429);
  });
});

describe("isLookupMiss", () => {
  it("counts the 4xx a mismatched lookup actually throws", () => {
    expect(isLookupMiss(new ApiError(404, "u", null))).toBe(true);
    expect(isLookupMiss(new ApiError(400, "u", null))).toBe(true);
    expect(isLookupMiss(new ApiError(422, "u", null))).toBe(true);
  });

  it("does not count outages, throttling, or errors from our own code", () => {
    expect(isLookupMiss(new ApiError(500, "u", null))).toBe(false);
    expect(isLookupMiss(new ApiError(503, "u", null))).toBe(false);
    expect(isLookupMiss(new ApiError(429, "u", null))).toBe(false);
    expect(isLookupMiss(new WheelsNetworkError("u", new Error("ECONNRESET")))).toBe(false);
    expect(isLookupMiss(new Error("Booking not found"))).toBe(false);
    expect(isLookupMiss(new TypeError("Cannot read properties of null"))).toBe(false);
  });
});
