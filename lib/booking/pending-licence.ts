"use client";

/**
 * Carries a guest's licence details (typed fields + uploaded scan URLs)
 * from checkout to the post-booking "Create account" flow. Deliberately a
 * *separate* sessionStorage key from `wheels.booking.draft` — the
 * confirmation page clears that draft on mount, but this needs to survive
 * long enough for the register page to pick it up afterward.
 */

const KEY = "wheels.pendingLicence";

export type PendingLicence = {
  licenceNumber: string;
  licenceIssue: string;
  licenceExpiry: string;
  licenceCountry: string;
  licenceFrontUrl?: string;
  licenceBackUrl?: string;
};

export function writePendingLicence(data: PendingLicence): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore (private modes, quota errors) — best-effort carry-through only
  }
}

export function readPendingLicence(): PendingLicence | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingLicence) : null;
  } catch {
    return null;
  }
}

export function clearPendingLicence(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Same carry-through, for the optional "Additional driver" add-on. */
const ADDITIONAL_DRIVER_KEY = "wheels.pendingAdditionalDriver";

export type PendingAdditionalDriver = {
  firstName: string;
  lastName: string;
  licenceFrontUrl?: string;
  licenceBackUrl?: string;
};

export function writePendingAdditionalDriver(data: PendingAdditionalDriver): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ADDITIONAL_DRIVER_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function readPendingAdditionalDriver(): PendingAdditionalDriver | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ADDITIONAL_DRIVER_KEY);
    return raw ? (JSON.parse(raw) as PendingAdditionalDriver) : null;
  } catch {
    return null;
  }
}

export function clearPendingAdditionalDriver(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ADDITIONAL_DRIVER_KEY);
  } catch {
    // ignore
  }
}

/** National ID (Lebanese) or passport (foreign) from guest checkout. */
const IDENTITY_KEY = "wheels.pendingIdentity";

export type PendingIdentity = {
  type: "id" | "passport";
  country: string;
  frontUrl?: string;
  backUrl?: string;
};

export function writePendingIdentity(data: PendingIdentity): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function readPendingIdentity(): PendingIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(IDENTITY_KEY);
    return raw ? (JSON.parse(raw) as PendingIdentity) : null;
  } catch {
    return null;
  }
}

export function clearPendingIdentity(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(IDENTITY_KEY);
  } catch {
    // ignore
  }
}
