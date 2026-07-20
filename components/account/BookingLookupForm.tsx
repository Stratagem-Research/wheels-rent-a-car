"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { BOOKING_REF_PATTERN } from "@/lib/booking/ref";
import { api, ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
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
      recordFailure();
      // Generic error regardless of cause — avoids enumeration of valid refs
      // per 13_manage_booking.md security note.
      const isServerError = err instanceof ApiError && err.status >= 500;
      setError(isServerError ? t("serverError") : t("notFound"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field
        label={t("referenceLabel")}
        required
        helper={t("referenceHelper")}
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
