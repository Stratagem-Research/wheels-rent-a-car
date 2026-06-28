/**
 * Zod schemas for the Wheels public API (Laravel backend).
 *
 * Schemas mirror the live response shapes captured by `scripts/wheels-api-smoke.sh`
 * in Phase 1, NOT the PDF. The PDF is the spec; the schemas are the contract.
 * When they drift, the live recording wins and we file an item in
 * `docs/Integration/API_Gap_Analysis.md`.
 *
 * Each top-level response schema uses `.passthrough()` so the backend can add
 * new fields without breaking parsing — only documented fields are validated.
 */

import { z } from "zod";

// ── Shared scalars ────────────────────────────────────────────────────────

/** Backend datetime, "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss". */
export const BackendDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/, "expected YYYY-MM-DD HH:mm[:ss]");

/** Backend date-only, "YYYY-MM-DD". */
export const BackendDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

/** Backend time-only, "HH:mm" or "HH:mm:ss". */
export const BackendTimeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "expected HH:mm[:ss]");

// ── /availability — vehicle + pricing ────────────────────────────────────

export const PricingSchema = z
  .object({
    days: z.number().int().positive(),
    /** Observed value: "standard". Backend may introduce others later. */
    price_option: z.string(),
    price_label: z.string(),
    daily_price: z.number().nonnegative(),
    total: z.number().nonnegative(),
  })
  .passthrough();

export const PublicVehicleSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string(),
    model: z.string(),
    /** PDF + Phase 1 confirm: always null in the public API. */
    license_plate: z.string().nullable(),
    vehicle_type_id: z.number().int().positive(),
    /** Mixed-case in live data ("small", "MEDIUM", "Luxury") — normalize at adapter time. */
    vehicle_type: z.string(),
    gearbox: z.string(),
    fuel_type: z.string(),
    number_of_seats: z.number().int().nonnegative(),
    is_available: z.boolean(),
    /** "booked" | null observed. PDF mentions inspection/maintenance as other possibilities. */
    unavailable_reason: z.string().nullable(),
    pricing: PricingSchema,
  })
  .passthrough();

export const AvailabilityResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .object({
      start_date_time: BackendDateTimeSchema,
      end_date_time: BackendDateTimeSchema,
      count: z.number().int().nonnegative(),
      vehicles: z.array(PublicVehicleSchema),
    })
    .passthrough(),
});

export const VehicleAvailabilityResponseSchema = z.object({
  success: z.literal(true),
  data: PublicVehicleSchema,
});

// ── /vehicles — website-enabled fleet sync (Adam 2026-06-22) ───────────

export const WizardVehicleSchema = z
  .object({
    id: z.number().int().positive(),
    vehicle_type_id: z.number().int().positive(),
    brand: z.string().optional(),
    model: z.string().optional(),
    name: z.string().optional(),
    display_name: z.string().optional(),
    vehicle_type: z.string().optional(),
    category: z.string().optional(),
    website_enabled: z.boolean().optional(),
    is_website_enabled: z.boolean().optional(),
    public_status: z.string().optional(),
    gearbox: z.string().optional(),
    fuel_type: z.string().optional(),
    number_of_seats: z.number().int().nonnegative().optional(),
    updated_at: BackendDateTimeSchema.optional(),
  })
  .passthrough();

export const WizardVehiclesResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .object({
      count: z.number().int().nonnegative().optional(),
      vehicles: z.array(WizardVehicleSchema),
    })
    .passthrough(),
});

// ── /booking-request — request body + response ───────────────────────────

export const BookingCustomerInputSchema = z
  .object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email().optional(),
    phone_number: z.string().min(1),
    phone_number2: z.string().optional(),
    gender: z.string().optional(),
    birth_date: BackendDateSchema.optional(),
    address: z.string().optional(),
    license_number: z.string().optional(),
    license_country: z.string().optional(),
    issue_date: BackendDateSchema.optional(),
    expiration_date: BackendDateSchema.optional(),
    notes: z.string().optional(),
  })
  .strict();

/** Accepted by Laravel — both `int` (location id) and `string` (free address) appear in the PDF. */
export const PickupAddressSchema = z.union([z.number().int(), z.string()]);

export const BookingRequestPayloadSchema = z
  .object({
    vehicle_id: z.number().int().positive(),
    start_date_time: BackendDateTimeSchema,
    end_date_time: BackendDateTimeSchema,
    pickup_address: PickupAddressSchema.optional(),
    drop_off_address: PickupAddressSchema.optional(),
    payment_method: z.string().optional(),
    payment_status: z.string().optional(),
    payment_reference: z.string().optional(),
    rate_type: z.string().optional(),
    mileage_plan: z.string().optional(),
    selected_rate_label: z.string().optional(),
    selected_rate_price: z.number().nonnegative().optional(),
    selected_mileage_limit: z.string().optional(),
    whatsapp_opt_in: z.boolean().optional(),
    email_opt_in: z.boolean().optional(),
    customer_language: z.string().optional(),
    notification_channel: z.string().optional(),
    promo_code: z.string().optional(),
    discount_amount: z.number().nonnegative().optional(),
    customer: BookingCustomerInputSchema,
    notes: z.string().optional(),
  })
  .strict();

export const BookingResponseVehicleSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string(),
    license_plate: z.string().nullable(),
  })
  .passthrough();

export const BookingResponseCustomerSchema = z
  .object({
    id: z.number().int().positive().optional(),
    /** Empirically contains a double-space ("Smoke  Test") — adapter normalizes. */
    name: z.string(),
    email: z.string().nullable(),
    phone_number: z.string(),
  })
  .passthrough();

export const BookingDataSchema = z
  .object({
    id: z.number().int().positive(),
    booking_id: z.number().int().positive(),
    reference: z.string().optional(),
    public_token: z.string().optional(),
    status: z.string(),
    payment_status: z.string(),
    amount: z.number().nonnegative(),
    paid_amount: z.number().nonnegative(),
    due_amount: z.number().nonnegative(),
    start_date_time: BackendDateTimeSchema.optional(),
    end_date_time: BackendDateTimeSchema.optional(),
    timezone: z.string().optional(),
    internal_block_until: BackendDateTimeSchema.optional(),
    start_date: BackendDateSchema.optional(),
    start_time: BackendTimeSchema.optional(),
    end_date: BackendDateSchema.optional(),
    end_time: BackendTimeSchema.optional(),
    vehicle: BookingResponseVehicleSchema,
    customer: BookingResponseCustomerSchema,
  })
  .passthrough();

export const BookingSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: BookingDataSchema,
});

export const BookingFailureResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
});

export const PublicRateSelectionSchema = z
  .object({
    rate_type: z.string().nullable().optional(),
    mileage_plan: z.string().nullable().optional(),
    selected_rate_label: z.string().nullable().optional(),
    selected_rate_price: z.number().nonnegative().nullable().optional(),
    selected_mileage_limit: z.string().nullable().optional(),
  })
  .passthrough();

export const BookingLookupDataSchema = z
  .object({
    reference: z.string(),
    booking_id: z.number().int().positive(),
    status: z.string(),
    payment_status: z.string(),
    amount: z.number().nonnegative(),
    paid_amount: z.number().nonnegative(),
    due_amount: z.number().nonnegative(),
    start_date_time: BackendDateTimeSchema,
    end_date_time: BackendDateTimeSchema,
    timezone: z.string().optional(),
    internal_block_until: BackendDateTimeSchema.optional(),
    pickup_address: z.union([z.number().int(), z.string()]).optional(),
    drop_off_address: z.union([z.number().int(), z.string()]).optional(),
    rate: PublicRateSelectionSchema.optional(),
    vehicle: BookingResponseVehicleSchema.extend({
      model: z.string().optional(),
      vehicle_type_id: z.number().int().positive().optional(),
    }).passthrough(),
    customer: BookingResponseCustomerSchema,
    notes: z.string().optional(),
  })
  .passthrough();

export const BookingLookupResponseSchema = z.object({
  success: z.literal(true),
  data: BookingLookupDataSchema,
});

export const BookingStatusDataSchema = z
  .object({
    reference: z.string(),
    booking_id: z.number().int().positive(),
    status: z.string(),
    payment_status: z.string(),
    amount: z.number().nonnegative(),
    paid_amount: z.number().nonnegative(),
    due_amount: z.number().nonnegative(),
    start_date_time: BackendDateTimeSchema,
    end_date_time: BackendDateTimeSchema,
    timezone: z.string().optional(),
    internal_block_until: BackendDateTimeSchema.optional(),
    vehicle: BookingResponseVehicleSchema.extend({
      model: z.string().optional(),
      vehicle_type_id: z.number().int().positive().optional(),
    }).passthrough(),
    customer: BookingResponseCustomerSchema.optional(),
  })
  .passthrough();

export const BookingStatusResponseSchema = z.object({
  success: z.literal(true),
  data: BookingStatusDataSchema,
});

export const GenericErrorResponseSchema = z
  .object({
    success: z.literal(false).optional(),
    message: z.string(),
  })
  .passthrough();

export const SyncStatusRequestSchema = z
  .object({
    parent_id: z.number().int().positive().optional(),
    status: z.string().optional(),
    payment_status: z.string().optional(),
    paid_amount: z.number().nonnegative().optional(),
    payment_method: z.string().optional(),
    payment_reference: z.string().optional(),
    payment_date: BackendDateSchema.optional(),
    sync_type: z.string().optional(),
    message: z.string().optional(),
  })
  .passthrough();

export const SyncStatusResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z
    .object({
      reference: z.string(),
      booking_id: z.number().int().positive(),
      status: z.string(),
      payment_status: z.string(),
      amount: z.number().nonnegative(),
      paid_amount: z.number().nonnegative(),
      due_amount: z.number().nonnegative(),
      payment_reference: z.string().nullable().optional(),
    })
    .passthrough(),
});

// ── Inferred TS types ────────────────────────────────────────────────────

export type Pricing = z.infer<typeof PricingSchema>;
export type PublicVehicle = z.infer<typeof PublicVehicleSchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
export type VehicleAvailabilityResponse = z.infer<typeof VehicleAvailabilityResponseSchema>;
export type WizardVehicle = z.infer<typeof WizardVehicleSchema>;
export type WizardVehiclesResponse = z.infer<typeof WizardVehiclesResponseSchema>;
export type BookingCustomerInput = z.infer<typeof BookingCustomerInputSchema>;
export type BookingRequestPayload = z.infer<typeof BookingRequestPayloadSchema>;
export type BookingData = z.infer<typeof BookingDataSchema>;
export type BookingSuccessResponse = z.infer<typeof BookingSuccessResponseSchema>;
export type BookingFailureResponse = z.infer<typeof BookingFailureResponseSchema>;
export type BookingLookupData = z.infer<typeof BookingLookupDataSchema>;
export type BookingLookupResponse = z.infer<typeof BookingLookupResponseSchema>;
export type BookingStatusData = z.infer<typeof BookingStatusDataSchema>;
export type BookingStatusResponse = z.infer<typeof BookingStatusResponseSchema>;
export type GenericErrorResponse = z.infer<typeof GenericErrorResponseSchema>;
export type SyncStatusRequest = z.infer<typeof SyncStatusRequestSchema>;
export type SyncStatusResponse = z.infer<typeof SyncStatusResponseSchema>;
