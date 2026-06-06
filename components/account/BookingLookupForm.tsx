"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field, HelperText } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { BOOKING_REF_PATTERN } from "@/lib/booking/ref";
import { api, ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { readRefMap } from "@/lib/api/wheels-public";
import type { Booking } from "@/types/domain";

/**
 * Guest booking lookup per 13_manage_booking.md.
 *
 * - Strict ref pattern: WRC-YYMMDD-XXXX
 * - Generic error message on failure to avoid enumeration of valid refs.
 * - Soft client-side rate limit (5 attempts per session, 15-min cooldown)
 *   matching the server policy noted in the spec.
 */

const ATTEMPTS_KEY = "wheels.lookupAttempts";
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 15 * 60 * 1000;

interface AttemptsState {
  failures: number[];
}

function readAttempts(): AttemptsState {
  if (typeof window === "undefined") return { failures: [] };
  try {
    const raw = window.sessionStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return { failures: [] };
    const parsed = JSON.parse(raw) as AttemptsState;
    const now = Date.now();
    return { failures: parsed.failures.filter((ts) => now - ts < COOLDOWN_MS) };
  } catch {
    return { failures: [] };
  }
}

function recordFailure(): AttemptsState {
  const curr = readAttempts();
  const next: AttemptsState = { failures: [...curr.failures, Date.now()] };
  try {
    window.sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export interface BookingLookupFormProps {
  onSuccess: (booking: Booking) => void;
  /** Default ref to pre-fill from URL. */
  defaultRef?: string;
  /** Default email to pre-fill. */
  defaultEmail?: string;
}

export function BookingLookupForm({
  onSuccess,
  defaultRef = "",
  defaultEmail = "",
}: BookingLookupFormProps) {
  const t = useTranslations("bookingLookup");
  const [ref, setRef] = React.useState(defaultRef.toUpperCase());
  const [email, setEmail] = React.useState(defaultEmail);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side rate limit gate (matches server's 5/15min policy).
    const attempts = readAttempts();
    if (attempts.failures.length >= MAX_ATTEMPTS) {
      setError(t("tooManyAttempts"));
      return;
    }

    if (!BOOKING_REF_PATTERN.test(ref.trim())) {
      setError(t("invalidReference"));
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError(t("invalidEmail"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.post<Booking>(endpoints.bookingLookup, {
        ref: ref.trim(),
        email: email.trim().toLowerCase(),
      });
      onSuccess(result);
    } catch (err) {
      const shouldUseFallback =
        !(err instanceof ApiError) || err.status <= 0 || err.status >= 500;
      if (shouldUseFallback) {
        // Temporary resilience path: if lookup endpoint is unavailable,
        // use browser ref-map for same-device recovery.
        const fallback = lookupViaRefMap(ref.trim(), email.trim().toLowerCase());
        if (fallback) {
          onSuccess(fallback);
          return;
        }
      }
      recordFailure();
      // Generic error regardless of cause — avoids enumeration of valid refs
      // per 13_manage_booking.md security note.
      const isServerError = err instanceof ApiError && err.status >= 500;
      setError(
        isServerError
          ? t("serverError")
          : t("notFound"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Fallback used when the API call fails — looks the booking up in the
   * browser's localStorage ref-map written when this device created the
   * booking. Only succeeds if BOTH ref + email match. Returns the partial
   * Booking shape just enough for the manage-booking UI to render the
   * "Pending backend lookup" placeholder (full details still come from the
   * confirmation page in real-API mode).
   */
  function lookupViaRefMap(refValue: string, emailValue: string): Booking | null {
    if (typeof window === "undefined") return null;
    const map = readRefMap(window.localStorage);
    const entry = map[refValue];
    if (!entry || entry.email.toLowerCase() !== emailValue) return null;
    // We don't have the full Booking server-side, so synthesize a minimal
    // record. The consumer (BookingDetailPanel) tolerates missing optional
    // fields and renders a banner pointing the user back to their email/
    // WhatsApp confirmation.
    return {
      ref: entry.ref,
      state: "pending",
      createdAt: entry.createdAt,
      pickup: { type: "branch", datetime: entry.createdAt },
      return: { datetime: entry.createdAt },
      vehicle: { vehicleId: "", rate: { type: "best-price", mileage: "capped-200km" } },
      vehicleSnapshot: {
        id: "",
        slug: "",
        make: "",
        model: "",
        year: 0,
        category: "economy",
        images: [],
      },
      extras: [],
      protectionTierId: "pt-basic",
      driver: {
        firstName: "",
        lastName: "",
        email: entry.email,
        phone: "",
        dob: "",
        licenceNumber: "",
        licenceIssue: "",
        licenceExpiry: "",
        country: "LB",
      },
      paymentMethod: "cash",
      marketingConsent: false,
      whatsappOptIn: false,
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
      currency: "USD",
    } satisfies Booking;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field
        label={t("referenceLabel")}
        required
        helper={
          <HelperText className="text-ink-50">
            {t("referenceHelper")}
          </HelperText>
        }
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            placeholder={t("referencePlaceholder")}
            aria-describedby={describedBy}
            invalid={invalid}
            value={ref}
            onChange={(e) => setRef(e.target.value.toUpperCase())}
            className="mono-md uppercase"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        )}
      </Field>
      <Field label={t("emailLabel")} required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="email"
            autoComplete="email"
            aria-describedby={describedBy}
            invalid={invalid}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button type="submit" variant="cta" size="lg" fullWidth loading={submitting}>
        {t("submit")}
      </Button>
    </form>
  );
}
