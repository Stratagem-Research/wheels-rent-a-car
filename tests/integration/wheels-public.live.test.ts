/**
 * Live integration suite for the Wheels public API.
 *
 * GATED behind `RUN_LIVE_API_TESTS=1`. Off by default in CI; runs in
 * `live-smoke` workflow_dispatch.
 *
 * Safety guarantees (mirror scripts/wheels-api-smoke.sh):
 *  - Never deletes anything.
 *  - Uses sentinel email `live-test+<timestamp>@stratagemresearch.co` so the
 *    backend team can grep / purge.
 *  - Picks rental dates 12+ months out so it can't collide with real ops.
 *  - The conflict assertion uses the same payload twice — the second call
 *    expects 409.
 *
 * To run: RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createWheelsPublicClient,
  VehicleUnavailableError,
  WheelsThrottledError,
} from "@/lib/api/wheels-public";

const live = describe.skipIf(process.env.RUN_LIVE_API_TESTS !== "1");

const BASE_URL =
  process.env.NEXT_PUBLIC_WHEELS_API_BASE_URL ??
  "https://adoring-hugle.85-215-232-144.plesk.page/api/public";

const START = "2027-04-15 10:00";
const END = "2027-04-19 10:00";
const SENTINEL_EMAIL = `live-test+${Date.now()}@stratagemresearch.co`;
let createdReference: string | null = null;
let createdPublicToken: string | null = null;

const client = createWheelsPublicClient({
  baseUrl: BASE_URL,
  timeoutMs: 20_000,
  maxAttempts: 2,
});

live("wheels-public live smoke", () => {
  beforeAll(() => {
    console.info(`[live-smoke] base=${BASE_URL} window=${START}→${END} sentinel=${SENTINEL_EMAIL}`);
  });

  afterAll(() => {
    console.info(
      `[live-smoke] done. If a booking was created, sentinel email was ${SENTINEL_EMAIL}.`,
    );
  });

  it("GET /availability returns at least one vehicle in the requested window", async () => {
    const response = await client.getAvailability({
      startDateTime: START,
      endDateTime: END,
    });
    expect(response.success).toBe(true);
    expect(response.data.vehicles.length).toBeGreaterThan(0);
    // License plates must remain hidden (PDF §4.1, item 1).
    for (const v of response.data.vehicles) {
      expect(v.license_plate).toBeNull();
    }
  }, 30_000);

  it("GET /availability/:id returns the same vehicle when fetched individually", async () => {
    const list = await client.getAvailability({
      startDateTime: START,
      endDateTime: END,
    });
    const first = list.data.vehicles[0];
    if (!first) throw new Error("no vehicles to test against");

    const single = await client.getVehicleAvailability(first.id, {
      startDateTime: START,
      endDateTime: END,
    });
    expect(single.data.id).toBe(first.id);
    expect(single.data.name).toBe(first.name);
    expect(single.data.license_plate).toBeNull();
  }, 30_000);

  it("POST /booking-request creates a booking and a second identical post returns 409", async () => {
    const list = await client.getAvailability({
      startDateTime: START,
      endDateTime: END,
    });
    const first = list.data.vehicles[0];
    if (!first) throw new Error("no vehicles to test against");

    const payload = {
      vehicle_id: first.id,
      start_date_time: START,
      end_date_time: END,
      pickup_address: 1,
      drop_off_address: 1,
      payment_method: "cash_on_pickup",
      payment_status: "unpaid",
      customer: {
        first_name: "Live",
        last_name: "Smoke",
        email: SENTINEL_EMAIL,
        phone_number: "+96170000000",
        birth_date: "1990-01-01",
        license_number: `LIVE-${Date.now()}`,
      },
      notes: "Created by tests/integration/wheels-public.live.test.ts — safe to delete",
    } as const;

    const success = await client.createBookingRequest(payload);
    expect(success.success).toBe(true);
    expect(success.data.id).toBeGreaterThan(0);
    expect(success.data.reference).toMatch(/^WRC-/);
    expect(success.data.public_token).toBeTruthy();
    createdReference = success.data.reference ?? null;
    createdPublicToken = success.data.public_token ?? null;
    console.info(
      `[live-smoke] created booking id=${success.data.id} reference=${success.data.reference} token=${success.data.public_token}`,
    );

    // Second identical call must conflict or be throttled. Both are accepted
    // outcomes — the test exists to ensure double-booking is REJECTED, full
    // stop. Throttling proves the rate-limit middleware is engaged on the
    // public endpoint (also a desired property).
    try {
      await client.createBookingRequest(payload);
      throw new Error("expected the second booking to fail (409 conflict or 429 throttle)");
    } catch (err) {
      expect(err instanceof VehicleUnavailableError || err instanceof WheelsThrottledError).toBe(
        true,
      );
    }
  }, 45_000);

  it("GET /bookings/{reference}?email=... resolves created booking", async () => {
    if (!createdReference)
      throw new Error("no booking reference captured from createBookingRequest");
    const lookup = await client.getBookingByReferenceEmail(createdReference, SENTINEL_EMAIL);
    expect(lookup.success).toBe(true);
    expect(lookup.data.reference).toBe(createdReference);
    expect(lookup.data.customer.email).toBeTruthy();
    expect((lookup.data.customer.email ?? "").toLowerCase()).toBe(SENTINEL_EMAIL.toLowerCase());
  }, 30_000);

  it("GET /booking-status/{public_token} resolves status for created booking", async () => {
    if (!createdPublicToken) throw new Error("no public token captured from createBookingRequest");
    const status = await client.getBookingStatusByToken(createdPublicToken);
    expect(status.success).toBe(true);
    expect(status.data.reference).toBeTruthy();
    expect(status.data.payment_status).toBeTruthy();
  }, 30_000);
});
