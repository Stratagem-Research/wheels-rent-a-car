"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { differenceInHours, parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import { formatUsd } from "@/lib/booking/pricing";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Booking } from "@/types/domain";

/**
 * Modify / Cancel modals for booking detail.
 *
 * Modify (mock) — lets the user pick a new pickup datetime; submits as a
 * non-payment-affecting change. Real backend would recompute pricing and
 * gate by policy.
 *
 * Cancel — computes a mock refund preview based on hours-until-pickup
 * (≥24h free, otherwise one-day rate fee). 2-step confirmation as required
 * by 12_account.md.
 */

export function ModifyBookingModal({
  booking,
  children,
}: {
  booking: Booking;
  children: React.ReactNode;
}) {
  const [pickupDate, setPickupDate] = React.useState(booking.pickup.datetime.slice(0, 10));
  const [pickupTime, setPickupTime] = React.useState(booking.pickup.datetime.slice(11, 16));
  const [submitting, setSubmitting] = React.useState(false);

  const onConfirm = async () => {
    setSubmitting(true);
    try {
      // Mock: no real PATCH endpoint exists yet. Just fire the analytics event.
      await new Promise((r) => setTimeout(r, 300));
      track(EVENTS.BOOKING_MODIFIED, { ref: booking.ref });
      toast.success("Modification request submitted — we'll WhatsApp you to confirm.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>Modify booking</ModalTitle>
        <ModalDescription>
          Change your pickup date and time. We&apos;ll confirm by WhatsApp.
        </ModalDescription>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            aria-label="New pickup date"
          />
          <Input
            type="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            aria-label="New pickup time"
          />
        </div>
        <ModalFooter>
          <Button variant="secondary">Keep as is</Button>
          <Button variant="primary" loading={submitting} onClick={onConfirm}>
            Request change
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function CancelBookingModal({
  booking,
  children,
}: {
  booking: Booking;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState<"preview" | "confirm">("preview");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Mock refund preview: free if ≥ 24h before pickup.
  const hoursToPickup = Math.max(
    0,
    differenceInHours(parseISO(booking.pickup.datetime), new Date()),
  );
  const refundFull = hoursToPickup >= 24;
  const oneDayCents = Math.round(booking.price.baseRateCents / Math.max(1, daysBetween(booking)));
  const refundCents = refundFull
    ? booking.price.totalCents
    : Math.max(0, booking.price.totalCents - oneDayCents);

  const onConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.post(endpoints.bookingCancelPreview, { ref: booking.ref });
      // Real cancel endpoint would mutate state; here we just fire analytics.
      track(EVENTS.BOOKING_CANCELLED, { ref: booking.ref });
      toast.success("Booking cancelled. A confirmation will arrive shortly.");
      router.refresh();
    } catch {
      setError("Couldn't cancel right now. Try again or chat with us on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="sm">
        {step === "preview" ? (
          <>
            <ModalTitle>Cancel this booking?</ModalTitle>
            <ModalDescription>
              {refundFull
                ? `You'll receive a full refund of ${formatUsd(refundCents)} within 3–10 business days.`
                : `Within 24 hours of pickup — a one-day rate fee applies. Refund: ${formatUsd(refundCents)}.`}
            </ModalDescription>
            <ModalFooter>
              <Button variant="secondary">Keep booking</Button>
              <Button variant="cta" onClick={() => setStep("confirm")}>
                Continue to cancel
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalTitle>Confirm cancellation</ModalTitle>
            <ModalDescription>
              We&apos;ll cancel {booking.ref}. This can&apos;t be undone — you&apos;ll need to
              re-book if your plans change.
            </ModalDescription>
            {error ? <ErrorText className="mt-3">{error}</ErrorText> : null}
            <ModalFooter>
              <Button variant="secondary" onClick={() => setStep("preview")}>
                Back
              </Button>
              <Button variant="cta" loading={submitting} onClick={onConfirm}>
                Cancel booking
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

function daysBetween(booking: Booking): number {
  try {
    return Math.max(
      1,
      Math.round(
        (parseISO(booking.return.datetime).getTime() -
          parseISO(booking.pickup.datetime).getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    );
  } catch {
    return 1;
  }
}
