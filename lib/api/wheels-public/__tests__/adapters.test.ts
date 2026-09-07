import { describe, expect, it } from "vitest";
import {
  fromBookingDraft,
  IncompleteBookingDraftError,
  MissingBackendVehicleIdError,
  serializeAddonsAndProtectionAsNotes,
  synthesizeBookingRef,
  toInternalAvailableVehicles,
  toInternalBooking,
} from "../adapters";
import { BookingRequestPayloadSchema, BookingSuccessResponseSchema } from "../schemas";
import { ADD_ONS, PROTECTION_TIERS } from "@/lib/api/fixtures/catalog";
import { VEHICLES } from "@/lib/api/fixtures/vehicles";
import type { BookingDraft } from "@/types/domain";
import availabilitySuccess from "./fixtures/availability-success.json";
import bookingSuccess from "./fixtures/booking-success.json";

const yaris = VEHICLES.find((v) => v.slug === "toyota-yaris")!;

function draft(overrides: Partial<BookingDraft> = {}): BookingDraft {
  return {
    pickup: { type: "airport", locationId: "br-bey-airport", datetime: "2027-04-15T07:00:00.000Z" },
    return: { locationId: "br-bey-airport", datetime: "2027-04-19T07:00:00.000Z" },
    vehicle: { vehicleId: yaris.id, rate: { type: "best-price", mileage: "capped-200km" } },
    extras: [],
    protectionTierId: "pt-basic",
    driver: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+96170123456",
      dob: "1980-01-01",
      licenceNumber: "ABC123",
      licenceIssue: "2020-01-01",
      licenceExpiry: "2030-01-01",
      country: "LB",
    },
    paymentMethod: "cash",
    marketingConsent: false,
    whatsappOptIn: true,
    flightNumber: "ME203",
    ...overrides,
  };
}

describe("wheels-public/adapters", () => {
  describe("toInternalAvailableVehicles", () => {
    it("converts the live availability fixture to AvailableVehicle[]", () => {
      const parsed = (availabilitySuccess as { data: { vehicles: unknown[] } }).data
        .vehicles as Parameters<typeof toInternalAvailableVehicles>[0];
      const result = toInternalAvailableVehicles(parsed);
      expect(result.length).toBe(parsed.length);
      const first = result[0]!;
      // 4 rate variants per vehicle (2 rate types × 2 mileage plans).
      expect(first.rates).toHaveLength(4);
      // Best-price + capped should equal the backend's raw daily price * 100.
      const bestCapped = first.rates.find(
        (r) => r.type === "best-price" && r.mileage === "capped-200km",
      )!;
      expect(bestCapped.perDayCents).toBe(Math.round(20 * 100));
      // Flexible + unlimited should be highest.
      const flexUnlimited = first.rates.find(
        (r) => r.type === "flexible" && r.mileage === "unlimited",
      )!;
      expect(flexUnlimited.perDayCents).toBeGreaterThan(bestCapped.perDayCents);
    });

    it("dailyRateFromCents is the backend's authoritative number", () => {
      const result = toInternalAvailableVehicles([
        {
          id: 999,
          name: "TEST",
          model: "TEST",
          license_plate: null,
          vehicle_type_id: 1,
          vehicle_type: "small",
          gearbox: "automatic",
          fuel_type: "petrol",
          number_of_seats: 4,
          is_available: true,
          unavailable_reason: null,
          pricing: {
            days: 7,
            price_option: "standard",
            price_label: "Standard Price",
            daily_price: 33,
            total: 231,
          },
        },
      ]);
      expect(result[0]!.vehicle.dailyRateFromCents).toBe(3300);
      expect(result[0]!.rates[0]!.totalCents).toBe(3300 * 7);
    });
  });

  describe("synthesizeBookingRef", () => {
    it("produces a valid WRC-YYMMDD-XXXX ref", () => {
      const ref = synthesizeBookingRef(1271, new Date("2026-05-20T10:00:00.000Z"));
      expect(ref).toMatch(/^WRC-260520-[A-Z0-9]{4}$/);
    });

    it("is stable for a given (id, date) pair", () => {
      const d = new Date("2026-05-20T00:00:00.000Z");
      expect(synthesizeBookingRef(42, d)).toBe(synthesizeBookingRef(42, d));
    });

    it("differs across different ids on the same day", () => {
      const d = new Date("2026-05-20T00:00:00.000Z");
      expect(synthesizeBookingRef(1, d)).not.toBe(synthesizeBookingRef(2, d));
    });
  });

  describe("fromBookingDraft", () => {
    it("builds a payload the schema accepts", () => {
      const payload = fromBookingDraft(draft(), {
        resolveVehicleId: () => 131,
        addOns: ADD_ONS,
        protectionTiers: PROTECTION_TIERS,
      });
      expect(() => BookingRequestPayloadSchema.parse(payload)).not.toThrow();
    });

    it("omits empty licence dates so Wizard does not reject checkout scans-only", () => {
      const payload = fromBookingDraft(
        draft({
          driver: {
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
            phone: "+96170123456",
            dob: "1980-01-01",
            licenceNumber: "",
            licenceIssue: "",
            licenceExpiry: "",
            country: "LB",
          },
        }),
        { resolveVehicleId: () => 131 },
      );
      expect(payload.customer.issue_date).toBeUndefined();
      expect(payload.customer.expiration_date).toBeUndefined();
      expect(() => BookingRequestPayloadSchema.parse(payload)).not.toThrow();
    });

    it("converts ISO UTC dates to Beirut local backend strings", () => {
      const payload = fromBookingDraft(draft(), { resolveVehicleId: () => 131 });
      // 2027-04-15T07:00:00Z is Beirut 10:00 (EEST UTC+3)
      expect(payload.start_date_time).toBe("2027-04-15 10:00");
      expect(payload.end_date_time).toBe("2027-04-19 10:00");
    });

    it("includes notes summarising rate / protection / add-ons / flight", () => {
      const payload = fromBookingDraft(
        draft({
          extras: [{ addOnId: ADD_ONS[0]!.id, qty: 1 }],
          protectionTierId: PROTECTION_TIERS[0]!.id,
        }),
        {
          resolveVehicleId: () => 131,
          addOns: ADD_ONS,
          protectionTiers: PROTECTION_TIERS,
        },
      );
      expect(payload.notes).toMatch(/Rate:/);
      expect(payload.notes).toMatch(/Protection:/);
      expect(payload.notes).toMatch(/Add-ons:/);
      expect(payload.notes).toMatch(/Flight: ME203/);
      expect(payload.notes).toMatch(/WhatsApp/);
    });


    it("sends structured rate fields ", () => {
      const payload = fromBookingDraft(draft(), {
        resolveVehicleId: () => 131,
        addOns: ADD_ONS,
        protectionTiers: PROTECTION_TIERS,
      });
      expect(payload.rate_type).toBe("best_price");
      expect(payload.mileage_plan).toBe("200km_per_day");
      expect(payload.selected_rate_label).toContain("Best Price");
      expect(payload.whatsapp_opt_in).toBe(true);
    });

    it("passes website-validated promo fields to Wizard payload", () => {
      const payload = fromBookingDraft(draft({ promoCode: "SUMMER15" }), {
        resolveVehicleId: () => 131,
        addOns: ADD_ONS,
        protectionTiers: PROTECTION_TIERS,
        promoDiscountCents: 1500,
      });
      expect(payload.promo_code).toBe("SUMMER15");
      expect(payload.discount_amount).toBe(15);
    });

    it("maps payment_method correctly across all frontend methods", () => {
      const map: Record<NonNullable<BookingDraft["paymentMethod"]>, string> = {
        card: "online_payment",
        "whish-online": "online_payment",
        neo: "online_payment",
        cash: "cash_on_pickup",
        transfer: "bank_transfer",
        omt: "omt",
      };
      for (const [method, expected] of Object.entries(map)) {
        const payload = fromBookingDraft(
          draft({ paymentMethod: method as BookingDraft["paymentMethod"] }),
          { resolveVehicleId: () => 131 },
        );
        expect(payload.payment_method).toBe(expected);
      }
    });

    it("throws IncompleteBookingDraftError when required fields missing", () => {
      expect(() =>
        fromBookingDraft(draft({ vehicle: undefined }), { resolveVehicleId: () => 131 }),
      ).toThrow(IncompleteBookingDraftError);
      expect(() =>
        fromBookingDraft(draft({ driver: undefined }), { resolveVehicleId: () => 131 }),
      ).toThrow(IncompleteBookingDraftError);
      expect(() =>
        fromBookingDraft(draft({ paymentMethod: undefined }), { resolveVehicleId: () => 131 }),
      ).toThrow(IncompleteBookingDraftError);
    });

    it("throws MissingBackendVehicleIdError when the resolver returns null", () => {
      expect(() => fromBookingDraft(draft(), { resolveVehicleId: () => null })).toThrow(
        MissingBackendVehicleIdError,
      );
    });

    it("uses locationId or address for pickup/drop-off", () => {
      const payload = fromBookingDraft(
        draft({
          pickup: {
            type: "address-delivery",
            address: "Hamra St",
            datetime: draft().pickup.datetime,
          },
          return: { address: "BCD parking", datetime: draft().return.datetime },
        }),
        { resolveVehicleId: () => 131 },
      );
      expect(payload.pickup_address).toBe("Hamra St");
      expect(payload.drop_off_address).toBe("BCD parking");
    });

    it("availability window matches submit payload datetimes (parity contract)", () => {
      const d = draft({
        pickup: { type: "branch", locationId: "br-hazmieh", datetime: "2026-07-21T10:00" },
        return: { locationId: "br-hazmieh", datetime: "2026-07-24T10:00" },
      });
      const payload = fromBookingDraft(d, { resolveVehicleId: () => 131 });
      expect(payload.start_date_time).toBe("2026-07-21 10:00");
      expect(payload.end_date_time).toBe("2026-07-24 10:00");
      expect(payload.pickup_address).toBe(1);
      expect(payload.drop_off_address).toBe(1);
    });
  });

  describe("serializeAddonsAndProtectionAsNotes", () => {
    it("preserves a stable ordering for snapshot use", () => {
      const notes = serializeAddonsAndProtectionAsNotes({
        draft: draft({
          extras: [
            { addOnId: ADD_ONS[1]!.id, qty: 2 },
            { addOnId: ADD_ONS[0]!.id, qty: 1 },
          ],
          protectionTierId: PROTECTION_TIERS[1]!.id,
          promoCode: "SUMMER15",
        }),
        addOns: ADD_ONS,
        tiers: PROTECTION_TIERS,
        freeformNotes: "Please clean the seats.",
      });
      expect(notes).toMatchSnapshot();
    });

    it("adds a reconciliation line for transfer, matching the omt one", () => {
      const omtNotes = serializeAddonsAndProtectionAsNotes({
        draft: draft({ paymentMethod: "omt" }),
        addOns: ADD_ONS,
        tiers: PROTECTION_TIERS,
      });
      const transferNotes = serializeAddonsAndProtectionAsNotes({
        draft: draft({ paymentMethod: "transfer" }),
        addOns: ADD_ONS,
        tiers: PROTECTION_TIERS,
      });
      expect(omtNotes).toMatch(/match by reference for reconciliation/);
      expect(transferNotes).toMatch(/match by reference for reconciliation/);
    });
  });

  describe("toInternalBooking", () => {
    const successData = BookingSuccessResponseSchema.parse(bookingSuccess).data;

    it("uses backend reference when present, derives state, and re-uses draft details", () => {
      const result = toInternalBooking(successData, {
        draft: draft(),
        vehicle: yaris,
        price: {
          baseRateCents: 8000,
          extrasCents: 0,
          protectionCents: 0,
          taxesCents: 0,
          feesCents: 0,
          discountCents: 0,
          totalCents: 0,
          depositCents: 30000,
        },
        clock: () => new Date("2026-05-20T10:00:00.000Z"),
      });
      expect(result.ref).toBe(successData.reference);
      expect(result.state).toBe("pending");
      expect(result.price.totalCents).toBe(successData.amount * 100);
      expect(result.vehicleSnapshot.slug).toBe(yaris.slug);
    });

    it("maps card/whish/neo drafts to confirmed when Wizard status is not cancelled", () => {
      const result = toInternalBooking(successData, {
        draft: draft({ paymentMethod: "whish-online" }),
        vehicle: yaris,
        price: {
          baseRateCents: 8000,
          extrasCents: 0,
          protectionCents: 0,
          taxesCents: 0,
          feesCents: 0,
          discountCents: 0,
          totalCents: 0,
          depositCents: 30000,
        },
        clock: () => new Date("2026-05-20T10:00:00.000Z"),
      });
      expect(result.state).toBe("confirmed");
    });

    it("returns pending state for transfer/omt", () => {
      const result = toInternalBooking(successData, {
        draft: draft({ paymentMethod: "transfer" }),
        vehicle: yaris,
        price: {
          baseRateCents: 0,
          extrasCents: 0,
          protectionCents: 0,
          taxesCents: 0,
          feesCents: 0,
          discountCents: 0,
          totalCents: 0,
          depositCents: 0,
        },
        clock: () => new Date("2026-05-20T10:00:00.000Z"),
      });
      expect(result.state).toBe("pending");
    });

    it("trusts backend start_date_time and end_date_time from the live payload", () => {
      const result = toInternalBooking(successData, {
        draft: draft(),
        vehicle: yaris,
        price: {
          baseRateCents: 0,
          extrasCents: 0,
          protectionCents: 0,
          taxesCents: 0,
          feesCents: 0,
          discountCents: 0,
          totalCents: 0,
          depositCents: 0,
        },
        clock: () => new Date("2026-05-20T10:00:00.000Z"),
      });
      expect(result.return.datetime).toBe("2027-04-19T07:00:00.000Z");
      expect(result.pickup.datetime).toBe("2027-04-15T07:00:00.000Z");
    });
  });

});
