/**
 * Endpoint catalog. Centralised so:
 *   1. Mock handlers and the typed client reference the same strings.
 *   2. Renaming a path is a one-file change.
 *   3. New endpoints are visible in the diff.
 */

export const API_BASE = "/api";
export const WHEELS_PUBLIC_BASE = "/api/public";
export const WHEELS_INTERNAL_BASE = "/api/v1";

export const endpoints = {
  // Vehicles
  vehicles: `${API_BASE}/vehicles`,
  vehicleBySlug: (slug: string) => `${API_BASE}/vehicles/${slug}`,
  vehiclesFeatured: `${API_BASE}/vehicles/featured`,
  vehiclesSimilar: `${API_BASE}/vehicles/similar`,
  vehiclesLongTermPopular: `${API_BASE}/vehicles/long-term-popular`,

  // Booking funnel
  bookingAvailability: `${API_BASE}/booking/availability`,
  bookingRate: `${API_BASE}/booking/rate`,
  bookingQuote: `${API_BASE}/booking/quote`,
  bookingSubmit: `${API_BASE}/booking/submit`,
  bookingLookup: `${API_BASE}/booking/lookup`,
  bookingPublicLookup: (reference: string) =>
    `${WHEELS_PUBLIC_BASE}/bookings/${encodeURIComponent(reference)}`,
  bookingPublicStatusByToken: (publicToken: string) =>
    `${WHEELS_PUBLIC_BASE}/booking-status/${encodeURIComponent(publicToken)}`,
  bookingInternalSyncStatus: (reference: string) =>
    `${WHEELS_INTERNAL_BASE}/bookings/${encodeURIComponent(reference)}/sync-status`,
  bookingCancelPreview: `${API_BASE}/booking/cancel-preview`,
  bookingCancel: (ref: string) => `${API_BASE}/booking/${ref}/cancel`,

  // Catalog
  addons: `${API_BASE}/addons`,
  protectionTiers: `${API_BASE}/protection-tiers`,
  longTermTiers: `${API_BASE}/long-term-tiers`,

  // Locations
  locations: `${API_BASE}/locations`,
  locationBySlug: (slug: string) => `${API_BASE}/locations/${slug}`,
  locationVehicles: (slug: string) => `${API_BASE}/locations/${slug}/vehicles`,

  // Account (auth required)
  account: `${API_BASE}/account`,
  accountBookings: `${API_BASE}/account/bookings`,
  accountBookingByRef: (ref: string) => `${API_BASE}/account/bookings/${ref}`,
  accountBookingCancel: (ref: string) => `${API_BASE}/account/bookings/${ref}/cancel`,
  accountDocuments: `${API_BASE}/account/documents`,
  accountDocumentById: (id: string) => `${API_BASE}/account/documents/${id}`,
  accountSavedVehicles: `${API_BASE}/account/saved`,
  accountSavedVehicleById: (vehicleId: string) => `${API_BASE}/account/saved/${vehicleId}`,

  // Auth
  authLogin: `${API_BASE}/auth/login`,
  authRegister: `${API_BASE}/auth/register`,
  authForgotPassword: `${API_BASE}/auth/forgot-password`,
  authResetPassword: `${API_BASE}/auth/reset-password`,
  authLogout: `${API_BASE}/auth/logout`,
  authMe: `${API_BASE}/auth/me`,

  // Leads
  leadsLongTerm: `${API_BASE}/leads/long-term`,
  leadsChauffeur: `${API_BASE}/leads/chauffeur`,
  leadsCorporate: `${API_BASE}/leads/corporate`,
  contact: `${API_BASE}/contact`,

  // Misc
  reviews: `${API_BASE}/reviews`,
  helpSearch: `${API_BASE}/help/search`,
  siteConfig: `${API_BASE}/site-config`,
  categoryBySlug: (slug: string) => `${API_BASE}/categories/${slug}`,

  // Payments
  paymentsWhishCreate: `${API_BASE}/payments/whish/create`,
  paymentsWhishStatus: `${API_BASE}/payments/whish/status`,
  paymentsWhishCallbackSuccess: `${API_BASE}/payments/whish/callback/success`,
  paymentsWhishCallbackFailure: `${API_BASE}/payments/whish/callback/failure`,
} as const;

export type Endpoints = typeof endpoints;
