import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/wheels-public/client";

const mockHandleBookingLookup = vi.fn();
vi.mock("@/lib/server/booking-service", () => ({
  handleBookingLookup: (...args: unknown[]) => mockHandleBookingLookup(...args),
}));

import { POST } from "@/app/api/booking/lookup/route";
import { resetBookingLookupGuard } from "@/lib/server/booking-lookup-guard";

const post = (body: unknown, ip = "1.1.1.1") =>
  POST(
    new Request("http://localhost/api/booking/lookup", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );

const pair = (n: number) => ({ ref: `WRC-260520-A${n}XX`, email: "victim@example.com" });

describe("POST /api/booking/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBookingLookupGuard();
  });

  it("returns the booking when the pair matches", async () => {
    mockHandleBookingLookup.mockResolvedValue({ ref: "WRC-260520-9KQ4" });
    const res = await post({ ref: "WRC-260520-9KQ4", email: "victim@example.com" });
    expect(res.status).toBe(200);
  });

  it("answers 429 after repeated misses against one email, whatever the IP", async () => {
    mockHandleBookingLookup.mockRejectedValue(new ApiError(404, "u", null));
    for (let i = 0; i < 8; i += 1) {
      expect((await post(pair(i), `10.0.0.${i}`)).status).toBe(404);
    }
    const res = await post(pair(9), "10.0.9.9");
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    // The blocked request never reaches the backend.
    expect(mockHandleBookingLookup).toHaveBeenCalledTimes(8);
  });

  it("does not lock anyone out when the backend is down", async () => {
    mockHandleBookingLookup.mockRejectedValue(new ApiError(503, "u", null));
    for (let i = 0; i < 20; i += 1) {
      expect((await post(pair(i), `10.0.0.${i}`)).status).toBe(404);
    }
    expect((await post(pair(99), "10.0.9.9")).status).toBe(404);
  });

  it("does not count an error thrown by our own lookup code", async () => {
    mockHandleBookingLookup.mockRejectedValue(new Error("index unavailable"));
    for (let i = 0; i < 20; i += 1) {
      expect((await post(pair(i), `10.1.0.${i}`)).status).toBe(404);
    }
    expect((await post(pair(99), "10.1.9.9")).status).toBe(404);
  });

  it("returns 400 for a malformed body and does not count it as a guess", async () => {
    for (let i = 0; i < 20; i += 1) {
      const res = await POST(
        new Request("http://localhost/api/booking/lookup", { method: "POST", body: "not json" }),
      );
      expect(res.status).toBe(400);
    }
    expect(mockHandleBookingLookup).not.toHaveBeenCalled();
    mockHandleBookingLookup.mockResolvedValue({ ref: "WRC-260520-9KQ4" });
    expect((await post({ ref: "WRC-260520-9KQ4", email: "victim@example.com" }, "6.6.6.6")).status).toBe(200);
  });
});
