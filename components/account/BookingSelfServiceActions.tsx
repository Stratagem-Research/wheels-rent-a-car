"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Calendar as CalendarIcon, Edit3, FileText, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CancelBookingModal, ModifyBookingModal } from "@/components/account/BookingActionModals";
import { bookingToIcs, downloadIcs } from "@/lib/booking/calendar";
import { buildManageBookingUrl } from "@/lib/booking/manage-booking-url";
import { useBookingCatalog } from "@/hooks/useBookingCatalog";
import { whatsAppHref } from "@/lib/whatsapp";
import type { Booking } from "@/types/domain";

export type BookingSelfServiceContext = "confirmation" | "account" | "guest";

export interface BookingSelfServiceActionsProps {
  booking: Booking;
  context: BookingSelfServiceContext;
  /** When true, wraps actions in a Card with a heading (account/guest aside layout). */
  showCard?: boolean;
}

export function BookingSelfServiceActions({
  booking,
  context,
  showCard = true,
}: BookingSelfServiceActionsProps) {
  const tAccount = useTranslations("accountPages.detail");
  const tConfirmation = useTranslations("bookingFlow.confirmation");
  const { branches } = useBookingCatalog();

  const pickupBranch = branches.find((b) => b.id === booking.pickup.locationId);
  const returnBranch = branches.find((b) => b.id === booking.return.locationId);
  const cancellable = booking.state === "confirmed" || booking.state === "pending";

  const onAddToCalendar = () => {
    const ics = bookingToIcs(
      booking,
      pickupBranch?.name ?? booking.pickup.address ?? "Wheels Rent A Car",
      returnBranch?.name ?? booking.return.address ?? pickupBranch?.name ?? "Wheels Rent A Car",
    );
    downloadIcs(ics, `wheels-${booking.ref}.ics`);
  };

  const onViewInvoice = () => {
    if (context === "account") {
      document.getElementById("booking-payment")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.location.href = buildManageBookingUrl({
      ref: booking.ref,
      email: booking.driver.email,
    });
  };

  const labels =
    context === "confirmation"
      ? {
          addToCalendar: tConfirmation("addToCalendar"),
          viewInvoice: tConfirmation("viewInvoice"),
          modify: tConfirmation("modify"),
          cancel: tConfirmation("cancel"),
          needChange: tConfirmation("needChange"),
          preferChat: tConfirmation("preferChat"),
          whatsappUs: tConfirmation("whatsappUs"),
          actions: null as string | null,
          needHelp: null as string | null,
        }
      : {
          addToCalendar: tAccount("addToCalendar"),
          viewInvoice: tAccount("viewInvoice"),
          modify: tAccount("modifyBooking"),
          cancel: tAccount("cancelBooking"),
          needChange: null as string | null,
          preferChat: null as string | null,
          whatsappUs: tAccount("chatOnWhatsapp"),
          actions: tAccount("actions"),
          needHelp: tAccount("needHelp"),
        };

  const primaryActions = (
    <>
      <Button
        variant="primary"
        size="md"
        className="w-full justify-center sm:w-auto"
        onClick={onAddToCalendar}
      >
        <CalendarIcon className="size-4 shrink-0" aria-hidden="true" /> {labels.addToCalendar}
      </Button>
      <Button
        variant="secondary"
        size="md"
        className="w-full justify-center sm:w-auto"
        onClick={onViewInvoice}
      >
        <FileText className="size-4 shrink-0" aria-hidden="true" /> {labels.viewInvoice}
      </Button>
      {cancellable ? (
        <>
          <ModifyBookingModal booking={booking}>
            <Button
              variant="tertiary"
              size={context === "confirmation" ? "sm" : "md"}
              className="w-full justify-center sm:w-auto"
            >
              <Edit3 className="size-4 shrink-0" aria-hidden="true" /> {labels.modify}
            </Button>
          </ModifyBookingModal>
          <CancelBookingModal booking={booking}>
            <Button
              variant="tertiary"
              size={context === "confirmation" ? "sm" : "md"}
              className="w-full justify-center sm:w-auto"
            >
              <X className="size-4 shrink-0" aria-hidden="true" /> {labels.cancel}
            </Button>
          </CancelBookingModal>
        </>
      ) : null}
    </>
  );

  const whatsAppCard = (
    <Card variant={context === "confirmation" ? "outline" : "default"} className="flex flex-col gap-2 p-5">
      <span className="label-md text-ink-60">{labels.preferChat ?? labels.needHelp}</span>
      <Button asChild variant="whatsapp" size="md">
        <a
          href={whatsAppHref("confirmation", { ref: booking.ref })}
          target="_blank"
          rel="noopener noreferrer"
        >
          {context === "confirmation" ? (
            <>
              <Phone className="size-4" aria-hidden="true" /> {labels.whatsappUs}
            </>
          ) : (
            labels.whatsappUs
          )}
        </a>
      </Button>
    </Card>
  );

  if (!showCard) {
    return (
      <div className="flex min-w-0 flex-col gap-3">
        {labels.needChange ? (
          <div className="flex min-w-0 flex-col gap-2">
            <span className="label-md text-ink-60">{labels.needChange}</span>
            {/*
              Wrap on all widths — four actions (calendar / invoice / modify / cancel)
              overflow a 360px confirmation aside when forced into one row.
            */}
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">{primaryActions}</div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-2">{primaryActions}</div>
        )}
        {whatsAppCard}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Card variant="default" className="flex flex-col gap-3">
        {labels.actions ? <h2 className="headline-md text-ink-100">{labels.actions}</h2> : null}
        {primaryActions}
      </Card>
      {whatsAppCard}
    </div>
  );
}
