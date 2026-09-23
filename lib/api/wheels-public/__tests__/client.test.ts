import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  createWheelsPublicClient,
  createWheelsInternalClient,
  VehicleUnavailableError,
  WheelsThrottledError,
  WheelsValidationError,
  ApiError as WheelsApiError,
} from "../client";
import availabilitySuccess from "./fixtures/availability-success.json";
import availabilityOneVehicle from "./fixtures/availability-one-vehicle.json";
import bookingSuccess from "./fixtures/booking-success.json";
import bookingConflict from "./fixtures/booking-conflict.json";
import bookingLookupSuccess from "./fixtures/booking-lookup-success.json";
import bookingStatusSuccess from "./fixtures/booking-status-success.json";

const BASE = "https://api.test/public";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function client() {
  return createWheelsPublicClient({
    baseUrl: BASE,
    timeoutMs: 1_000,
    maxAttempts: 3,
  });
}

describe("wheels-public/client", () => {
  describe("createWheelsPublicClient", () => {
    it("throws when NEXT_PUBLIC_WHEELS_API_BASE_URL is missing", () => {
      const previous = process.env.NEXT_PUBLIC_WHEELS_API_BASE_URL;
      delete process.env.NEXT_PUBLIC_WHEELS_API_BASE_URL;
      try {
        expect(() => createWheelsPublicClient()).toThrow(/NEXT_PUBLIC_WHEELS_API_BASE_URL is required/);
      } finally {
        process.env.NEXT_PUBLIC_WHEELS_API_BASE_URL = previous;
      }
    });
  });

  describe("getAvailability", () => {
    it("sends the documented query params and parses the response", async () => {
      let capturedUrl = "";
      server.use(
        http.get(`${BASE}/availability`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(availabilitySuccess);
        }),
      );

      const result = await client().getAvailability({
        startDateTime: "2027-04-15 10:00",
        endDateTime: "2027-04-19 10:00",
        vehicleTypeId: 1,
        gearbox: "automatic",
        seats: 4,
        includeBooked: true,
      });

      expect(result.data.count).toBe(
        (availabilitySuccess as { data: { count: number } }).data.count,
      );
      const url = new URL(capturedUrl);
      expect(url.searchParams.get("start_date_time")).toBe("2027-04-15 10:00");
      expect(url.searchParams.get("end_date_time")).toBe("2027-04-19 10:00");
      expect(url.searchParams.get("vehicle_type_id")).toBe("1");
      expect(url.searchParams.get("gearbox")).toBe("automatic");
      expect(url.searchParams.get("seats")).toBe("4");
      expect(url.searchParams.get("include_booked")).toBe("1");
    });

    it("omits absent optional filters from the query", async () => {
      let capturedUrl = "";
      server.use(
        http.get(`${BASE}/availability`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(availabilitySuccess);
        }),
      );

      await client().getAvailability({
        startDateTime: "2027-04-15 10:00",
        endDateTime: "2027-04-19 10:00",
      });

      const url = new URL(capturedUrl);
      expect(url.searchParams.has("vehicle_type_id")).toBe(false);
      expect(url.searchParams.has("gearbox")).toBe(false);
      expect(url.searchParams.has("seats")).toBe(false);
      expect(url.searchParams.has("include_booked")).toBe(false);
    });

    it("retries on 5xx then succeeds", async () => {
      let calls = 0;
      server.use(
        http.get(`${BASE}/availability`, () => {
          calls += 1;
          if (calls === 1) return new HttpResponse(null, { status: 503 });
          return HttpResponse.json(availabilitySuccess);
        }),
      );
      const result = await client().getAvailability({
        startDateTime: "2027-04-15 10:00",
        endDateTime: "2027-04-19 10:00",
      });
      expect(calls).toBe(2);
      expect(result.success).toBe(true);
    });

    it("does NOT retry on 4xx", async () => {
      let calls = 0;
      server.use(
        http.get(`${BASE}/availability`, () => {
          calls += 1;
          return HttpResponse.json({ message: "Bad request" }, { status: 400 });
        }),
      );
      await expect(
        client().getAvailability({ startDateTime: "x", endDateTime: "y" }),
      ).rejects.toBeInstanceOf(WheelsApiError);
      expect(calls).toBe(1);
    });

    it("throws WheelsValidationError when the response shape drifts", async () => {
      server.use(
        http.get(`${BASE}/availability`, () =>
          HttpResponse.json({ success: true, data: { wat: true } }),
        ),
      );
      await expect(
        client().getAvailability({ startDateTime: "x", endDateTime: "y" }),
      ).rejects.toBeInstanceOf(WheelsValidationError);
    });
  });

  describe("getVehicleAvailability", () => {
    it("hits /availability/:id and parses", async () => {
      let capturedUrl = "";
      server.use(
        http.get(`${BASE}/availability/:id`, ({ request, params }) => {
          capturedUrl = request.url;
          expect(params.id).toBe("131");
          return HttpResponse.json(availabilityOneVehicle);
        }),
      );
      const result = await client().getVehicleAvailability(131, {
        startDateTime: "2027-04-15 10:00",
        endDateTime: "2027-04-19 10:00",
      });
      expect(result.data.id).toBe(132);
      expect(new URL(capturedUrl).pathname).toBe("/public/availability/131");
    });
  });

  describe("createBookingRequest", () => {
    const validPayload = {
      vehicle_id: 131,
      start_date_time: "2027-04-15 10:00",
      end_date_time: "2027-04-19 10:00",
      pickup_address: 1,
      drop_off_address: 1,
      payment_method: "cash_on_pickup",
      payment_status: "unpaid",
      customer: {
        first_name: "Ada",
        last_name: "Lovelace",
        phone_number: "+96170123456",
      },
    } as const;

    it("sends the payload as JSON and parses the success response", async () => {
      let receivedBody: unknown;
      let receivedContentType: string | null = null;
      server.use(
        http.post(`${BASE}/booking-request`, async ({ request }) => {
          receivedContentType = request.headers.get("content-type");
          receivedBody = await request.json();
          return HttpResponse.json(bookingSuccess);
        }),
      );

      const result = await client().createBookingRequest(validPayload);
      expect(result.success).toBe(true);
      expect(receivedContentType).toContain("application/json");
      expect(receivedBody).toMatchObject({ vehicle_id: 131, customer: { first_name: "Ada" } });
    });

    it("maps 409 to VehicleUnavailableError", async () => {
      server.use(
        http.post(`${BASE}/booking-request`, () =>
          HttpResponse.json(bookingConflict, { status: 409 }),
        ),
      );
      await expect(client().createBookingRequest(validPayload)).rejects.toBeInstanceOf(
        VehicleUnavailableError,
      );
    });

    it("maps 429 to WheelsThrottledError and exposes retry-after", async () => {
      server.use(
        http.post(`${BASE}/booking-request`, () =>
          HttpResponse.json(
            { message: "Too Many Attempts." },
            {
              status: 429,
              headers: { "retry-after": "60" },
            },
          ),
        ),
      );
      try {
        await client().createBookingRequest(validPayload);
        throw new Error("expected to throw");
      } catch (err) {
        expect(err).toBeInstanceOf(WheelsThrottledError);
        expect((err as WheelsThrottledError).retryAfterSeconds).toBe(60);
      }
    });

    it("rejects malformed payloads before making a network call", async () => {
      let calls = 0;
      server.use(
        http.post(`${BASE}/booking-request`, () => {
          calls += 1;
          return HttpResponse.json(bookingSuccess);
        }),
      );
      await expect(
        client().createBookingRequest({
          ...validPayload,
          start_date_time: "tomorrow",
        }),
      ).rejects.toBeTruthy();
      expect(calls).toBe(0);
    });

    it("does NOT retry on 409 (the conflict is meaningful — retrying creates dupes)", async () => {
      let calls = 0;
      server.use(
        http.post(`${BASE}/booking-request`, () => {
          calls += 1;
          return HttpResponse.json(bookingConflict, { status: 409 });
        }),
      );
      await expect(client().createBookingRequest(validPayload)).rejects.toBeInstanceOf(
        VehicleUnavailableError,
      );
      expect(calls).toBe(1);
    });
  });

  describe("getBookingByReferenceEmail", () => {
    it("calls /bookings/{reference}?email=... and parses payload", async () => {
      let capturedUrl = "";
      server.use(
        http.get(`${BASE}/bookings/:reference`, ({ request, params }) => {
          capturedUrl = request.url;
          expect(params.reference).toBe("WRC-260628-9KXG");
          return HttpResponse.json(bookingLookupSuccess);
        }),
      );

      const result = await client().getBookingByReferenceEmail(
        "WRC-260628-9KXG",
        "smoke@example.com",
      );
      expect(result.data.reference).toBe("WRC-260628-9KXG");
      expect(new URL(capturedUrl).searchParams.get("email")).toBe("smoke@example.com");
    });
  });

  describe("getBookingStatusByToken", () => {
    it("calls /booking-status/{public_token} and parses payload", async () => {
      server.use(
        http.get(`${BASE}/booking-status/:publicToken`, ({ params }) => {
          expect(params.publicToken).toBe("pub_2hn2rx7s");
          return HttpResponse.json(bookingStatusSuccess);
        }),
      );

      const result = await client().getBookingStatusByToken("pub_2hn2rx7s");
      expect(result.data.status).toBe("pending_approval");
      expect(result.data.payment_status).toBe("unpaid");
    });
  });

  describe("syncBookingStatus", () => {
    it("posts mapped payload to internal endpoint with bearer token", async () => {
      let authHeader: string | null = null;
      server.use(
        http.post("https://api.test/v1/bookings/:reference/sync-status", async ({ request }) => {
          authHeader = request.headers.get("authorization");
          const body = (await request.json()) as { sync_type?: string };
          expect(body.sync_type).toBe("status_update");
          return HttpResponse.json({
            success: true,
            message: "Synced",
            data: {
              reference: "WRC-270415-9KQ4",
              booking_id: 1197,
              status: "approved",
              payment_status: "paid",
              amount: 80,
              paid_amount: 80,
              due_amount: 0,
            },
          });
        }),
      );

      const internal = createWheelsInternalClient({
        baseUrl: "https://api.test/v1",
        apiToken: "internal_secret",
        timeoutMs: 1_000,
      });
      const result = await internal.syncBookingStatus("WRC-270415-9KQ4", {
        status: "approved",
        payment_status: "paid",
        sync_type: "status_update",
      });
      expect(authHeader).toBe("Bearer internal_secret");
      expect(result.success).toBe(true);
    });
  });
});
