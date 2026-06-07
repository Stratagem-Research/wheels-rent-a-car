/**
 * MSW handlers for every endpoint cited in /docs/Implementation/*.md.
 *
 * Failure modes: add `?mock-error=500` to any URL to force a 500. This lets
 * the booking flow exercise its error states without touching production
 * code paths. Other values: `404`, `timeout` (handler sleeps 20s then 500).
 */
import { delay, http, HttpResponse } from "msw";
import type {
  AvailabilityRequest,
  AvailableVehicle,
  Booking,
  BookingDraft,
  LookupBookingRequest,
  QuoteRequest,
  QuoteResponse,
  Rate,
  SubmitBookingRequest,
  SubmitBookingResponse,
  User,
} from "@/types/domain";
import { endpoints } from "@/lib/api/endpoints";
import { VEHICLES } from "./fixtures/vehicles";
import { BRANCHES } from "./fixtures/branches";
import {
  ADD_ONS,
  CHAUFFEUR_ITINERARIES,
  LONG_TERM_TIERS,
  PROTECTION_TIERS,
} from "./fixtures/catalog";
import { REVIEWS, SITE_CONFIG } from "./fixtures/content";
import { computePrice, generateBookingRef, perDayRate, rentalDays } from "./pricing";
import {
  liveAvailability,
  liveLookupBooking,
  liveSubmitBooking,
  realBookingApiEnabled,
  VehicleUnavailableError,
} from "@/lib/api/wheels-public/live-handlers";
import { fromBackendDateTime } from "@/lib/api/wheels-public/datetime";

const MOCK_USER: User = {
  id: "user-demo",
  firstName: "Demo",
  lastName: "User",
  email: "demo@wheels.local",
  emailVerified: true,
  phone: "+96170123456",
  country: "LB",
  preferences: { marketing: false, whatsappUpdates: true },
  createdAt: "2026-01-01T00:00:00.000Z",
};

// In-memory bookings keyed by ref. Resets on each dev-server reload.
const submittedBookings = new Map<string, Booking>();

function maybeFail(url: URL) {
  const err = url.searchParams.get("mock-error");
  if (err === "500") return HttpResponse.json({ message: "Mock 500" }, { status: 500 });
  if (err === "404") return HttpResponse.json({ message: "Mock 404" }, { status: 404 });
  return null;
}

function buildRatesFor(vehicleId: string): Rate[] {
  const vehicle = VEHICLES.find((v) => v.id === vehicleId);
  if (!vehicle) return [];
  return (["best-price", "flexible"] as const).flatMap((type) =>
    (["capped-200km", "unlimited"] as const).map((mileage) => {
      const perDay = perDayRate(vehicle, type, mileage);
      return {
        type,
        mileage,
        perDayCents: perDay,
        totalCents: perDay * 5, // sample 5-day total for the card
        nonRefundable: type === "best-price",
      } satisfies Rate;
    }),
  );
}

export const handlers = [
  // ── Site config ────────────────────────────────────────────────────────
  http.get(endpoints.siteConfig, ({ request }) => {
    const fail = maybeFail(new URL(request.url));
    if (fail) return fail;
    return HttpResponse.json(SITE_CONFIG);
  }),

  // ── Vehicles ───────────────────────────────────────────────────────────
  http.get(endpoints.vehicles, ({ request }) => {
    const url = new URL(request.url);
    const fail = maybeFail(url);
    if (fail) return fail;

    const category = url.searchParams.get("category");
    const trans = url.searchParams.get("trans");
    const seatsBucket = url.searchParams.get("seats");
    const minPrice = Number(url.searchParams.get("minPrice") ?? "0") * 100;
    const maxPrice = Number(url.searchParams.get("maxPrice") ?? "999") * 100;
    const sort = url.searchParams.get("sort") ?? "recommended";
    const page = Number(url.searchParams.get("page") ?? "1");
    const perPage = 24;

    let filtered = VEHICLES.filter((v) => {
      if (category && v.category !== category) return false;
      if (trans && trans !== "any" && v.transmission !== trans) return false;
      if (seatsBucket === "2" && v.seats > 2) return false;
      if (seatsBucket === "4-5" && (v.seats < 4 || v.seats > 5)) return false;
      if (seatsBucket === "6-7" && (v.seats < 6 || v.seats > 7)) return false;
      if (seatsBucket === "8+" && v.seats < 8) return false;
      if (v.dailyRateFromCents < minPrice) return false;
      if (maxPrice && v.dailyRateFromCents > maxPrice) return false;
      return true;
    });

    if (sort === "price-asc") filtered.sort((a, b) => a.dailyRateFromCents - b.dailyRateFromCents);
    if (sort === "price-desc") filtered.sort((a, b) => b.dailyRateFromCents - a.dailyRateFromCents);
    if (sort === "newest") filtered.sort((a, b) => b.year - a.year);
    if (sort === "largest") filtered.sort((a, b) => b.seats - a.seats);

    const start = (page - 1) * perPage;
    const items = filtered.slice(start, start + perPage);
    return HttpResponse.json({
      items,
      total: filtered.length,
      page,
      perPage,
      facets: {
        category: countBy(VEHICLES, (v) => v.category),
        transmission: countBy(VEHICLES, (v) => v.transmission),
        fuel: countBy(VEHICLES, (v) => v.fuel),
      },
    });
  }),

  http.get(endpoints.vehiclesFeatured, () => HttpResponse.json({ items: VEHICLES.slice(0, 8) })),

  http.get(endpoints.vehiclesSimilar, ({ request }) => {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");
    const seed = VEHICLES.find((v) => v.slug === slug);
    const items = (
      seed
        ? VEHICLES.filter((v) => v.category === seed.category && v.slug !== slug)
        : VEHICLES.slice(0, 6)
    ).slice(0, 6);
    return HttpResponse.json({ items });
  }),

  http.get(endpoints.vehiclesLongTermPopular, () =>
    HttpResponse.json({
      items: VEHICLES.filter((v) => ["sedan", "suv"].includes(v.category)).slice(0, 6),
    }),
  ),

  http.get("/api/vehicles/:slug", ({ params }) => {
    const slug = String(params.slug);
    const vehicle = VEHICLES.find((v) => v.slug === slug);
    if (!vehicle) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    return HttpResponse.json(vehicle);
  }),

  // ── Locations ──────────────────────────────────────────────────────────
  http.get(endpoints.locations, () => HttpResponse.json({ items: BRANCHES })),
  http.get("/api/locations/:slug", ({ params }) => {
    const branch = BRANCHES.find((b) => b.slug === String(params.slug));
    if (!branch) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    return HttpResponse.json(branch);
  }),
  http.get("/api/locations/:slug/vehicles", () =>
    HttpResponse.json({ items: VEHICLES.slice(0, 6) }),
  ),

  // ── Catalog ────────────────────────────────────────────────────────────
  http.get(endpoints.addons, () => HttpResponse.json({ items: ADD_ONS })),
  http.get(endpoints.protectionTiers, () => HttpResponse.json({ items: PROTECTION_TIERS })),
  http.get(endpoints.longTermTiers, () => HttpResponse.json({ items: LONG_TERM_TIERS })),

  // ── Reviews + help search ──────────────────────────────────────────────
  http.get(endpoints.reviews, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "10");
    return HttpResponse.json({ items: REVIEWS.slice(0, limit) });
  }),

  // ── Booking funnel ─────────────────────────────────────────────────────
  http.post(endpoints.bookingAvailability, async ({ request }) => {
    const url = new URL(request.url);
    const fail = maybeFail(url);
    if (fail) return fail;
    const body = (await request.json()) as AvailabilityRequest;

    if (realBookingApiEnabled()) {
      try {
        const result = await liveAvailability({
          pickupIso: body.pickup.datetime,
          returnIso: body.return.datetime,
        });
        return HttpResponse.json(result);
      } catch (err) {
        return HttpResponse.json(
          { message: err instanceof Error ? err.message : "Availability lookup failed." },
          { status: 502 },
        );
      }
    }

    await delay(200);
    const days = rentalDays(body.pickup.datetime, body.return.datetime);
    const items: AvailableVehicle[] = VEHICLES.map((vehicle) => ({
      vehicle,
      rates: buildRatesFor(vehicle.id).map((r) => ({
        ...r,
        totalCents: r.perDayCents * days,
      })),
    }));
    return HttpResponse.json({ items, rentalDays: days });
  }),

  http.post(endpoints.bookingRate, async ({ request }) => {
    const body = (await request.json()) as {
      vehicleId: string;
      rateType: "best-price" | "flexible";
      mileage: "capped-200km" | "unlimited";
      pickup: string;
      return: string;
    };
    const vehicle = VEHICLES.find((v) => v.id === body.vehicleId);
    if (!vehicle) return HttpResponse.json({ message: "Vehicle not found" }, { status: 404 });
    const days = rentalDays(body.pickup, body.return);
    const perDay = perDayRate(vehicle, body.rateType, body.mileage);
    return HttpResponse.json({
      perDayCents: perDay,
      totalCents: perDay * days,
      rentalDays: days,
    });
  }),

  http.post(endpoints.bookingQuote, async ({ request }) => {
    const url = new URL(request.url);
    const fail = maybeFail(url);
    if (fail) return fail;
    const body = (await request.json()) as QuoteRequest;
    const days = rentalDays(body.draft.pickup.datetime, body.draft.return.datetime);
    const price = computePrice(body.draft);
    const response: QuoteResponse = {
      rentalDays: days,
      price,
      changedSinceLastQuote: false,
    };
    return HttpResponse.json(response);
  }),

  http.post(endpoints.bookingSubmit, async ({ request }) => {
    const url = new URL(request.url);
    const fail = maybeFail(url);
    if (fail) return fail;
    const body = (await request.json()) as SubmitBookingRequest;
    const draft: BookingDraft = body.draft;
    if (!draft.vehicle || !draft.driver || !draft.paymentMethod) {
      return HttpResponse.json({ message: "Incomplete booking" }, { status: 400 });
    }

    if (realBookingApiEnabled()) {
      try {
        const result = await liveSubmitBooking({ draft });
        // Mirror the mock side-effect: in-memory bookings map so the
        // confirmation/account lookup handlers can still serve this booking
        // from the same tab session.
        submittedBookings.set(result.booking.ref, result.booking);
        return HttpResponse.json(result);
      } catch (err) {
        if (err instanceof VehicleUnavailableError) {
          return HttpResponse.json(
            { message: "Vehicle is not available for this period." },
            { status: 409 },
          );
        }
        return HttpResponse.json(
          { message: err instanceof Error ? err.message : "Booking submission failed." },
          { status: 502 },
        );
      }
    }

    const vehicle = VEHICLES.find((v) => v.id === draft.vehicle?.vehicleId);
    if (!vehicle) {
      return HttpResponse.json({ message: "Vehicle gone" }, { status: 409 });
    }
    const ref = generateBookingRef();
    const state =
      draft.paymentMethod === "card" || draft.paymentMethod === "cash" ? "confirmed" : "pending";

    const booking: Booking = {
      ref,
      state,
      createdAt: new Date().toISOString(),
      pickup: draft.pickup,
      return: draft.return,
      vehicle: draft.vehicle,
      vehicleSnapshot: {
        id: vehicle.id,
        slug: vehicle.slug,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        category: vehicle.category,
        images: vehicle.images,
      },
      extras: draft.extras,
      protectionTierId: draft.protectionTierId ?? "pt-basic",
      driver: draft.driver,
      flightNumber: draft.flightNumber,
      paymentMethod: draft.paymentMethod,
      marketingConsent: draft.marketingConsent,
      whatsappOptIn: draft.whatsappOptIn,
      promoCode: draft.promoCode,
      price: computePrice(draft),
      currency: "USD",
    };
    submittedBookings.set(ref, booking);
    const response: SubmitBookingResponse = { booking };
    return HttpResponse.json(response);
  }),

  http.post(endpoints.bookingLookup, async ({ request }) => {
    const body = (await request.json()) as LookupBookingRequest;
    if (realBookingApiEnabled()) {
      const fromSession = submittedBookings.get(body.ref);
      if (fromSession && fromSession.driver.email.toLowerCase() === body.email.toLowerCase()) {
        return HttpResponse.json(fromSession);
      }
      try {
        const lookup = await liveLookupBooking({
          reference: body.ref,
          email: body.email,
        });
        return HttpResponse.json(toBookingFromLookup(lookup.data));
      } catch {
        return HttpResponse.json({ message: "Not found" }, { status: 404 });
      }
    }
    const booking = submittedBookings.get(body.ref);
    if (!booking || booking.driver.email.toLowerCase() !== body.email.toLowerCase()) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(booking);
  }),

  http.post(endpoints.bookingCancelPreview, async ({ request }) => {
    const body = (await request.json()) as { ref: string };
    const booking = submittedBookings.get(body.ref);
    if (!booking) return HttpResponse.json({ refundCents: 0 });
    return HttpResponse.json({ refundCents: booking.price.totalCents });
  }),

  // ── Auth ───────────────────────────────────────────────────────────────
  http.post(endpoints.authLogin, async () => HttpResponse.json({ user: MOCK_USER })),
  http.post(endpoints.authRegister, async () =>
    HttpResponse.json({ user: MOCK_USER, requiresEmailConfirmation: false }),
  ),
  http.post(endpoints.authForgotPassword, async () => HttpResponse.json({ ok: true })),
  http.post(endpoints.authResetPassword, async () => HttpResponse.json({ user: MOCK_USER })),
  http.post(endpoints.authLogout, async () => HttpResponse.json({ ok: true })),
  http.get(endpoints.authMe, () => HttpResponse.json({ user: MOCK_USER })),

  // ── Account ────────────────────────────────────────────────────────────
  http.get(endpoints.account, () => HttpResponse.json({ user: MOCK_USER })),
  http.get(endpoints.accountBookings, () =>
    HttpResponse.json({
      items: Array.from(submittedBookings.values()),
      total: submittedBookings.size,
    }),
  ),
  http.get("/api/account/bookings/:ref", ({ params }) => {
    const booking = submittedBookings.get(String(params.ref));
    if (!booking) return HttpResponse.json({ message: "Not found" }, { status: 404 });
    return HttpResponse.json(booking);
  }),
  http.get(endpoints.accountDocuments, () => HttpResponse.json({ items: [] })),
  http.get(endpoints.accountSavedVehicles, () => HttpResponse.json({ items: [] })),

  // ── Leads + contact ────────────────────────────────────────────────────
  http.post(endpoints.leadsLongTerm, async () => HttpResponse.json({ id: "lead-lt-1" })),
  http.post(endpoints.leadsChauffeur, async () => HttpResponse.json({ id: "lead-ch-1" })),
  http.post(endpoints.leadsCorporate, async () => HttpResponse.json({ id: "lead-co-1" })),
  http.post(endpoints.contact, async () => HttpResponse.json({ id: "msg-1" })),

  // ── Chauffeur itineraries (CMS-driven in spec; mocked here) ────────────
  http.get("/api/chauffeur/itineraries", () => HttpResponse.json({ items: CHAUFFEUR_ITINERARIES })),
];

function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const k = key(it);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function toBookingFromLookup(lookup: {
  reference: string;
  status: string;
  start_date_time: string;
  end_date_time: string;
  customer: {
    name: string;
    email: string | null;
    phone_number: string;
    first_name?: string;
    last_name?: string;
  };
  vehicle: { id: number; name: string; model?: string };
  amount: number;
}): Booking {
  const [nameFirst = "", ...nameRest] = lookup.customer.name.trim().split(/\s+/);
  const fallbackFirst = lookup.customer.first_name ?? nameFirst;
  const fallbackLast = lookup.customer.last_name ?? nameRest.join(" ");
  const matchedVehicle = VEHICLES.find((vehicle) => vehicle.make === lookup.vehicle.name);
  const fallbackVehicle = matchedVehicle ?? VEHICLES[0]!;
  return {
    ref: lookup.reference,
    state:
      lookup.status === "approved" || lookup.status === "confirmed"
        ? "confirmed"
        : lookup.status === "cancelled" || lookup.status === "canceled"
          ? "cancelled"
          : "pending",
    createdAt: new Date().toISOString(),
    pickup: {
      type: "branch",
      datetime: fromBackendDateTime(lookup.start_date_time),
      locationId: "br-bey",
    },
    return: {
      datetime: fromBackendDateTime(lookup.end_date_time),
      locationId: "br-bey",
    },
    vehicle: {
      vehicleId: fallbackVehicle.id,
      rate: { type: "best-price", mileage: "capped-200km" },
    },
    vehicleSnapshot: {
      id: fallbackVehicle.id,
      slug: fallbackVehicle.slug,
      make: fallbackVehicle.make,
      model: fallbackVehicle.model,
      year: fallbackVehicle.year,
      category: fallbackVehicle.category,
      images: fallbackVehicle.images,
    },
    extras: [],
    protectionTierId: "pt-basic",
    driver: {
      firstName: fallbackFirst,
      lastName: fallbackLast,
      email: lookup.customer.email ?? "",
      phone: lookup.customer.phone_number,
      dob: "",
      licenceNumber: "",
      licenceIssue: "",
      licenceExpiry: "",
      country: "LB",
    },
    paymentMethod: "cash",
    marketingConsent: false,
    whatsappOptIn: false,
    price: {
      baseRateCents: Math.round(lookup.amount * 100),
      extrasCents: 0,
      protectionCents: 0,
      taxesCents: 0,
      feesCents: 0,
      discountCents: 0,
      totalCents: Math.round(lookup.amount * 100),
      depositCents: 0,
    },
    currency: "USD",
  };
}
