"use client";

import type { EventName, EventPayload } from "./events";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/**
 * Push an event to the GTM/GA4 dataLayer. Server-safe no-op until window
 * exists, so this can be called from React effects or click handlers without
 * branching for SSR.
 *
 * Cookie consent gating: if `wheels.consent === "essential-only"` in
 * localStorage, only essential events fire. Analytics events return silently.
 */

const ANALYTICS_EVENTS = new Set<string>([
  "search_submitted",
  "vehicle_viewed",
  "vehicle_selected",
  "extras_viewed",
  "extras_added",
  "protection_selected",
  "checkout_started",
  "payment_method_selected",
  "booking_completed",
  "whatsapp_clicked",
  "account_created",
  "booking_modified",
  "booking_cancelled",
]);

function isAnalyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const consent = window.localStorage.getItem("wheels.consent");
  // No decision yet -> default to disallow until banner is accepted.
  if (!consent) return false;
  return consent === "all";
}

export function track(event: EventName, payload: EventPayload = {}) {
  if (typeof window === "undefined") return;
  if (ANALYTICS_EVENTS.has(event) && !isAnalyticsAllowed()) return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...payload, _ts: Date.now() });
}

/** Update consent and replay buffered events that were blocked previously. */
export function setConsent(consent: "all" | "essential-only") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("wheels.consent", consent);
  // Future: replay buffered events. Sprint 11 wires the cookie banner.
}

export function getConsent(): "all" | "essential-only" | null {
  if (typeof window === "undefined") return null;
  return (window.localStorage.getItem("wheels.consent") as "all" | "essential-only" | null) ?? null;
}
