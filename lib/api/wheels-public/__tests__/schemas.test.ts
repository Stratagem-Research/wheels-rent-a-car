import { describe, expect, it } from "vitest";
import {
  AvailabilityResponseSchema,
  BookingLookupResponseSchema,
  BookingFailureResponseSchema,
  BookingRequestPayloadSchema,
  BookingStatusResponseSchema,
  BookingSuccessResponseSchema,
  GenericErrorResponseSchema,
  PublicVehicleSchema,
  VehicleAvailabilityResponseSchema,
} from "../schemas";
import availabilitySuccess from "./fixtures/availability-success.json";
import availabilityWithBooked from "./fixtures/availability-with-booked.json";
import availabilityOneVehicle from "./fixtures/availability-one-vehicle.json";
import bookingSuccess from "./fixtures/booking-success.json";
import bookingConflict from "./fixtures/booking-conflict.json";
import bookingLookupSuccess from "./fixtures/booking-lookup-success.json";
import bookingStatusSuccess from "./fixtures/booking-status-success.json";

describe("wheels-public/schemas", () => {
  describe("AvailabilityResponseSchema", () => {
    it("parses the live availability success fixture", () => {
      const parsed = AvailabilityResponseSchema.parse(availabilitySuccess);
      expect(parsed.success).toBe(true);
      expect(parsed.data.vehicles.length).toBe(parsed.data.count);
      expect(parsed.data.vehicles[0]?.id).toEqual(expect.any(Number));
    });

    it("parses the include_booked=1 fixture where some vehicles are unavailable", () => {
      const parsed = AvailabilityResponseSchema.parse(availabilityWithBooked);
      const booked = parsed.data.vehicles.filter((v) => !v.is_available);
      expect(booked.length).toBeGreaterThan(0);
      for (const v of booked) {
        expect(v.unavailable_reason).not.toBeNull();
      }
    });

    it("rejects a response without success=true", () => {
      const bad = { ...availabilitySuccess, success: false };
      expect(() => AvailabilityResponseSchema.parse(bad)).toThrow();
    });
  });

  describe("VehicleAvailabilityResponseSchema", () => {
    it("parses the single-vehicle fixture", () => {
      const parsed = VehicleAvailabilityResponseSchema.parse(availabilityOneVehicle);
      expect(parsed.data.pricing.daily_price).toBeGreaterThan(0);
      expect(parsed.data.license_plate).toBeNull();
    });
  });

  describe("PublicVehicleSchema", () => {
    it("accepts mixed-case vehicle_type values observed in the wild", () => {
      const base = (availabilitySuccess as { data: { vehicles: unknown[] } }).data.vehicles[0]!;
      for (const variant of ["small", "MEDIUM", "Luxury", "4X4 7SEATS"]) {
        expect(() =>
          PublicVehicleSchema.parse({ ...(base as object), vehicle_type: variant }),
        ).not.toThrow();
      }
    });

    it("rejects negative seat counts", () => {
      const base = (availabilitySuccess as { data: { vehicles: unknown[] } }).data.vehicles[0]!;
      expect(() =>
        PublicVehicleSchema.parse({ ...(base as object), number_of_seats: -1 }),
      ).toThrow();
    });
  });

  describe("BookingSuccessResponseSchema", () => {
    it("parses the live booking-success fixture", () => {
      const parsed = BookingSuccessResponseSchema.parse(bookingSuccess);
      expect(parsed.data.id).toBeGreaterThan(0);
      expect(parsed.data.booking_id).toBeGreaterThan(0);
      expect(parsed.data.amount).toBeGreaterThanOrEqual(0);
      expect(parsed.data.reference).toMatch(/^WRC-/);
      expect(parsed.data.public_token).toBeTruthy();
      expect(parsed.data.internal_block_until).toMatch(/^\d{4}-\d{2}-\d{2} /);
    });
  });

  describe("BookingLookupResponseSchema", () => {
    it("parses lookup by reference+email payload", () => {
      const parsed = BookingLookupResponseSchema.parse(bookingLookupSuccess);
      expect(parsed.data.reference).toBe("WRC-260628-9KXG");
      expect(parsed.data.customer.email).toContain("@");
    });
  });

  describe("BookingStatusResponseSchema", () => {
    it("parses status by public token payload", () => {
      const parsed = BookingStatusResponseSchema.parse(bookingStatusSuccess);
      expect(parsed.data.status).toBe("pending_approval");
      expect(parsed.data.payment_status).toBe("unpaid");
    });
  });

  describe("BookingFailureResponseSchema", () => {
    it("parses the live 409 conflict fixture", () => {
      const parsed = BookingFailureResponseSchema.parse(bookingConflict);
      expect(parsed.success).toBe(false);
      expect(parsed.message).toMatch(/not available/i);
    });
  });

  describe("GenericErrorResponseSchema", () => {
    it("parses sanitized 429/4xx-style message payloads", () => {
      const parsed = GenericErrorResponseSchema.parse({
        success: false,
        message: "Too Many Attempts.",
      });
      expect(parsed.message).toMatch(/attempts/i);
    });
  });

  describe("BookingRequestPayloadSchema", () => {
    it("accepts a minimal valid payload", () => {
      const payload = {
        vehicle_id: 131,
        start_date_time: "2027-04-15 10:00",
        end_date_time: "2027-04-19 10:00",
        customer: {
          first_name: "Ada",
          last_name: "Lovelace",
          phone_number: "+96170000000",
        },
      };
      expect(() => BookingRequestPayloadSchema.parse(payload)).not.toThrow();
    });

    it("accepts both numeric and string pickup_address (per PDF)", () => {
      const base = {
        vehicle_id: 131,
        start_date_time: "2027-04-15 10:00",
        end_date_time: "2027-04-19 10:00",
        customer: {
          first_name: "A",
          last_name: "B",
          phone_number: "+96170000000",
        },
      };
      expect(() => BookingRequestPayloadSchema.parse({ ...base, pickup_address: 1 })).not.toThrow();
      expect(() =>
        BookingRequestPayloadSchema.parse({ ...base, pickup_address: "Hazmieh" }),
      ).not.toThrow();
    });

    it("rejects malformed start_date_time", () => {
      const bad = {
        vehicle_id: 131,
        start_date_time: "Tomorrow at 10am",
        end_date_time: "2027-04-19 10:00",
        customer: { first_name: "A", last_name: "B", phone_number: "+96170000000" },
      };
      expect(() => BookingRequestPayloadSchema.parse(bad)).toThrow();
    });

    it("rejects unknown top-level fields (strict)", () => {
      const bad = {
        vehicle_id: 131,
        start_date_time: "2027-04-15 10:00",
        end_date_time: "2027-04-19 10:00",
        customer: { first_name: "A", last_name: "B", phone_number: "+96170000000" },
        ohSurprise: true,
      };
      expect(() => BookingRequestPayloadSchema.parse(bad)).toThrow();
    });
  });
});
