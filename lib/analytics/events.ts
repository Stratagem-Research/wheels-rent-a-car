/**
 * Event constants for the analytics dataLayer.
 *
 * Per 00_global.md §18, every event name is fixed across the app so GA4 and
 * Meta Pixel see consistent payloads. Source-of-truth for the booking funnel.
 */

export const EVENTS = {
  SEARCH_SUBMITTED: "search_submitted",
  VEHICLE_VIEWED: "vehicle_viewed",
  VEHICLE_SELECTED: "vehicle_selected",
  EXTRAS_VIEWED: "extras_viewed",
  EXTRAS_ADDED: "extras_added",
  PROTECTION_SELECTED: "protection_selected",
  CHECKOUT_STARTED: "checkout_started",
  PAYMENT_METHOD_SELECTED: "payment_method_selected",
  BOOKING_COMPLETED: "booking_completed",
  WHATSAPP_CLICKED: "whatsapp_clicked",
  ACCOUNT_CREATED: "account_created",
  BOOKING_MODIFIED: "booking_modified",
  BOOKING_CANCELLED: "booking_cancelled",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export type EventPayload = Record<string, string | number | boolean | undefined>;
