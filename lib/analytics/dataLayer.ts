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

const CONSENT_KEY = "wheels.consent";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readConsentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)wheels\.consent=([^;]*)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function writeConsentCookie(consent: "all" | "essential-only"): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_KEY}=${encodeURIComponent(consent)}; path=/; max-age=${CONSENT_MAX_AGE_SECONDS}; samesite=lax`;
}

function isAnalyticsAllowed(): boolean {
  return getConsent() === "all";
}

export function track(event: EventName, payload: EventPayload = {}) {
  if (typeof window === "undefined") return;
  if (ANALYTICS_EVENTS.has(event) && !isAnalyticsAllowed()) return;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...payload, _ts: Date.now() });
}

/** Persist consent in a cookie (primary) and localStorage (analytics + legacy reads). */
export function setConsent(consent: "all" | "essential-only") {
  if (typeof window === "undefined") return;
  writeConsentCookie(consent);
  try {
    window.localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // Cookie alone is enough when localStorage is blocked.
  }
}

export function getConsent(): "all" | "essential-only" | null {
  if (typeof window === "undefined") return null;

  const fromCookie = readConsentCookie();
  if (fromCookie === "all" || fromCookie === "essential-only") {
    return fromCookie;
  }

  try {
    const fromStorage = window.localStorage.getItem(CONSENT_KEY);
    if (fromStorage === "all" || fromStorage === "essential-only") {
      writeConsentCookie(fromStorage);
      return fromStorage;
    }
  } catch {
    // ignore
  }

  return null;
}
