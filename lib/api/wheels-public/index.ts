/**
 * Wheels public API integration layer.
 *
 * The booking funnel speaks the internal contract from `types/domain.ts`.
 * This module is the only place that knows the Laravel-shaped public API;
 * Next.js route handlers call this client and adapt responses to domain types.
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
  resolveWheelsPublicBaseUrl,
  resolveWheelsInternalBaseUrl,
  type WheelsPublicClient,
  type WheelsInternalClient,
  type WheelsPublicClientOptions,
} from "./client";
export {
  toInternalAvailableVehicles,
  catalogVehicleToAvailable,
  toInternalBooking,
  fromBookingDraft,
  synthesizeBookingRef,
  serializeAddonsAndProtectionAsNotes,
  MissingBackendVehicleIdError,
  IncompleteBookingDraftError,
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
  WizardVehicleSyncResponseSchema,
  type WizardVehicle,
  type WizardVehicleSyncResponse,
} from "./schemas";
