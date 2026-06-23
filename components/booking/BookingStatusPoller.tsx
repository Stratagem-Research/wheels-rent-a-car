"use client";

import * as React from "react";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { wizardStatusToBookingState } from "@/lib/booking/lookup-adapter";
import type { Booking, BookingState } from "@/types/domain";

interface BookingStatusPayload {
  status: string;
  reference: string;
}

export interface BookingStatusPollerProps {
  booking: Booking;
  publicToken: string | null;
  onStateChange: (state: BookingState) => void;
}

const POLL_INTERVAL_MS = 5_000;
const TERMINAL_STATES: BookingState[] = ["confirmed", "cancelled", "completed", "expired"];

/**
 * Polls `/api/booking/status?token=` while a booking is pending so the
 * confirmation hero updates when Wizard approves payment or ops action.
 */
export function BookingStatusPoller({
  booking,
  publicToken,
  onStateChange,
}: BookingStatusPollerProps) {
  const token = publicToken ?? booking.publicToken ?? null;

  React.useEffect(() => {
    if (!token || booking.state !== "pending") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const data = await api.get<BookingStatusPayload>(
          `${endpoints.bookingStatus}?token=${encodeURIComponent(token)}`,
        );
        if (cancelled) return;
        const next = wizardStatusToBookingState(data.status);
        if (next !== booking.state) {
          onStateChange(next);
        }
        if (!TERMINAL_STATES.includes(next)) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [token, booking.state, booking.ref, onStateChange]);

  return null;
}
