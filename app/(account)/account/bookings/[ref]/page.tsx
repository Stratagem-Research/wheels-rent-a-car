"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { BookingDetailPanel } from "@/components/account/BookingDetailPanel";
import { BookingSelfServiceActions } from "@/components/account/BookingSelfServiceActions";
import { api } from "@/lib/api/client";
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

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="tertiary" size="sm" className="self-start">
        <Link href="/account/bookings">
          <ArrowLeft className="size-4" aria-hidden="true" /> {t("backToBookings")}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <BookingDetailPanel booking={booking} />
        <BookingSelfServiceActions booking={booking} context="account" />
      </div>
    </div>
  );
}
