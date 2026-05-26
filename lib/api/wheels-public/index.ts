/**
 * Wheels public API integration layer.
 *
 * The booking funnel speaks the internal contract from `types/domain.ts`.
 * This module is the only place that knows the Laravel-shape lives:
 *
 *   funnel → mock handler → (flag on?)
 *                            ├── yes → wheels-public client + adapters → Laravel
 *                            └── no  → existing MSW fixtures
 *
 * Consumers should import from this index, not from sub-modules, so the
 * surface area stays stable when internals move.
 */

export {
  ApiError as WheelsApiError,
  VehicleUnavailableError,
  WheelsValidationError,
  WheelsThrottledError,
  WheelsNetworkError,
} from "./client";
export {
  getAvailability,
  getVehicleAvailability,
  createBookingRequest,
  getBookingByReferenceEmail,
  getBookingStatusByToken,
  createWheelsPublicClient,
  createWheelsInternalClient,
  type WheelsPublicClient,
  type WheelsInternalClient,
  type WheelsPublicClientOptions,
} from "./client";
export {
  toInternalAvailableVehicles,
  toInternalBooking,
  fromBookingDraft,
  synthesizeBookingRef,
  serializeAddonsAndProtectionAsNotes,
  readRefMap,
  writeRefMap,
  BOOKING_REF_MAP_STORAGE_KEY,
  MissingBackendVehicleIdError,
  IncompleteBookingDraftError,
  type BookingRefMapEntry,
  type FromBookingDraftOptions,
  type ToInternalBookingOptions,
} from "./adapters";
export {
  enrichVehicle,
  defaultOnMiss,
  resetEnrichmentWarnings,
  mapVehicleTypeToCategory,
  normalizeVehicleType,
  type BackendIdToSlugMap,
  type EnrichVehicleOptions,
} from "./vehicle-enrichment";
export {
  fromBackendDateTime,
  toBackendDateTime,
  fromBackendDateAndTime,
  WHEELS_API_TIMEZONE,
} from "./datetime";
export {
  mapWebsiteSyncToWizardPayload,
  REQUEST_STATE_SYNC_TYPE,
  type WebsiteBookingLifecycleState,
  type WebsiteToWizardSyncInput,
} from "./sync-status";
export type {
  AvailabilityResponse,
  BookingData,
  BookingLookupResponse,
  BookingStatusResponse,
  BookingFailureResponse,
  BookingRequestPayload,
  BookingSuccessResponse,
  SyncStatusRequest,
  SyncStatusResponse,
  PublicVehicle,
  Pricing,
  VehicleAvailabilityResponse,
} from "./schemas";
export {
  AvailabilityResponseSchema,
  BookingRequestPayloadSchema,
  BookingSuccessResponseSchema,
  BookingLookupResponseSchema,
  BookingStatusResponseSchema,
  BookingFailureResponseSchema,
  SyncStatusRequestSchema,
  SyncStatusResponseSchema,
  VehicleAvailabilityResponseSchema,
  PublicVehicleSchema,
} from "./schemas";
