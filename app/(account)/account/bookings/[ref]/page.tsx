"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Calendar as CalendarIcon, Edit3, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { BookingDetailPanel } from "@/components/account/BookingDetailPanel";
import { CancelBookingModal, ModifyBookingModal } from "@/components/account/BookingActionModals";
import { BRANCHES } from "@/lib/api/fixtures/branches";
import { api } from "@/lib/api/client";
import { whatsAppHref } from "@/lib/whatsapp";
import { bookingToIcs, downloadIcs } from "@/lib/booking/calendar";
import type { Booking } from "@/types/domain";

export default function AccountBookingDetailPage() {
  const t = useTranslations("accountPages.detail");
  const params = useParams<{ ref: string }>();
  const ref = params?.ref ?? "";
  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await api.get<Booking>(`/api/account/bookings/${ref}`);
        if (!cancelled) setBooking(result);
      } catch {
        if (!cancelled) setError(t("notFoundBody"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ref, t]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="headline-lg text-ink-100">{t("notFound")}</h1>
        <p className="body-md text-ink-60">{error}</p>
        <Button asChild variant="primary" className="self-start">
          <Link href="/account/bookings">{t("backToBookings")}</Link>
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  const pickupBranch = BRANCHES.find((b) => b.id === booking.pickup.locationId);
  const returnBranch = BRANCHES.find((b) => b.id === booking.return.locationId);

  const onAddToCalendar = () => {
    const ics = bookingToIcs(
      booking,
      pickupBranch?.name ?? booking.pickup.address ?? "Wheels Rent A Car",
      returnBranch?.name ?? booking.return.address ?? pickupBranch?.name ?? "Wheels Rent A Car",
    );
    downloadIcs(ics, `wheels-${booking.ref}.ics`);
  };

  const cancellable = booking.state === "confirmed" || booking.state === "pending";

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="tertiary" size="sm" className="self-start">
        <Link href="/account/bookings">
          <ArrowLeft className="size-4" aria-hidden="true" /> {t("backToBookings")}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <BookingDetailPanel booking={booking} />

        <aside className="flex flex-col gap-3">
          <Card variant="default" className="flex flex-col gap-3">
            <h2 className="headline-md text-ink-100">{t("actions")}</h2>
            <Button variant="primary" size="md" onClick={onAddToCalendar}>
              <CalendarIcon className="size-4" aria-hidden="true" /> {t("addToCalendar")}
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href={`/manage-booking?ref=${booking.ref}`}>
                <FileText className="size-4" aria-hidden="true" /> {t("viewInvoice")}
              </Link>
            </Button>
            {cancellable ? (
              <>
                <ModifyBookingModal booking={booking}>
                  <Button variant="tertiary" size="md">
                    <Edit3 className="size-4" aria-hidden="true" /> {t("modifyBooking")}
                  </Button>
                </ModifyBookingModal>
                <CancelBookingModal booking={booking}>
                  <Button variant="tertiary" size="md">
                    <X className="size-4" aria-hidden="true" /> {t("cancelBooking")}
                  </Button>
                </CancelBookingModal>
              </>
            ) : null}
          </Card>

          <Card variant="default" className="flex flex-col gap-2 p-5">
            <span className="label-md text-ink-60">{t("needHelp")}</span>
            <Button asChild variant="whatsapp" size="md">
              <a
                href={whatsAppHref("confirmation", { ref: booking.ref })}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("chatOnWhatsapp")}
              </a>
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
