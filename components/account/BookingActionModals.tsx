"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { differenceInHours, parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import {
  Modal,
  ModalClose,
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
 * Modify (mock), lets the user pick a new pickup datetime; submits as a
 * non-payment-affecting change. Real backend would recompute pricing and
 * gate by policy.
 *
 * Cancel submits a cancellation REQUEST to `/api/booking/{ref}/cancel` —
 * the booking is only cancelled after the Wheels team approves it in the
 * Wizard (system-boundary agreement). The refund shown is an estimate based
 * on hours-until-pickup (≥24h free, otherwise one-day rate fee). 2-step
 * confirmation as required by 12_account.md.
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
      toast.success("Modification request submitted, we'll WhatsApp you to confirm.");
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
  const t = useTranslations("accountPages.cancelModal");
  const router = useRouter();
  const [step, setStep] = React.useState<"preview" | "confirm" | "done">("preview");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estimated refund IF the request is approved: free if ≥ 24h before pickup.
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
      await api.post(endpoints.bookingCancel(booking.ref), {
        email: booking.driver.email,
      });
      track(EVENTS.BOOKING_CANCELLED, { ref: booking.ref });
      toast.success(t("requestedToast"));
      setStep("done");
      router.refresh();
    } catch {
      setError(t("requestError"));
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
            <ModalTitle>{t("previewTitle")}</ModalTitle>
            <ModalDescription>
              {refundFull
                ? t("previewRefundFull", { amount: formatUsd(refundCents) })
                : t("previewRefundPartial", { amount: formatUsd(refundCents) })}
            </ModalDescription>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="secondary">{t("keepBooking")}</Button>
              </ModalClose>
              <Button variant="cta" onClick={() => setStep("confirm")}>
                {t("continueToCancel")}
              </Button>
            </ModalFooter>
          </>
        ) : step === "confirm" ? (
          <>
            <ModalTitle>{t("confirmTitle")}</ModalTitle>
            <ModalDescription>{t("confirmBody", { ref: booking.ref })}</ModalDescription>
            {error ? <ErrorText className="mt-3">{error}</ErrorText> : null}
            <ModalFooter>
              <Button variant="secondary" onClick={() => setStep("preview")}>
                {t("back")}
              </Button>
              <Button variant="cta" loading={submitting} onClick={onConfirm}>
                {t("requestCancellation")}
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalTitle>{t("doneTitle")}</ModalTitle>
            <ModalDescription>{t("doneBody", { ref: booking.ref })}</ModalDescription>
            <ModalFooter>
              <ModalClose asChild>
                <Button variant="primary">{t("close")}</Button>
              </ModalClose>
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
