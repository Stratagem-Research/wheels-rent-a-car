"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Car, FileText, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSession } from "@/hooks/useSession";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { formatUsd } from "@/lib/booking/pricing";
import type { Booking } from "@/types/domain";

export default function AccountDashboard() {
  const t = useTranslations("accountPages.dashboard");
  const { session, ready } = useSession();
  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  // Snapshot mount time so the"upcoming" filter is stable across renders.
  const [now] = React.useState(() => Date.now());

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ items: Booking[] }>(endpoints.accountBookings);
        if (!cancelled) setBookings(res.items);
      } catch {
        if (!cancelled) setBookings([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !session || bookings === null) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  }

  const upcoming = [...bookings]
    .filter(
      (b) =>
        (b.state === "confirmed" || b.state === "pending") &&
        new Date(b.pickup.datetime).getTime() > now,
    )
    .sort(
      (a, b) => new Date(a.pickup.datetime).getTime() - new Date(b.pickup.datetime).getTime(),
    )[0];

  const recent = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const hour = new Date(now).getHours();
  const greet =
    hour < 12 ? t("greetMorning") : hour < 18 ? t("greetAfternoon") : t("greetEvening");

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="text-ink-60 overline">{t("eyebrow")}</p>
        <h1 className="headline-lg text-ink-100">
          {t("greeting", { greet, name: session.user.firstName })}
        </h1>
        <p className="lead-md text-ink-60">{upcoming ? t("comingUp") : t("noUpcoming")}</p>
      </header>

      {upcoming ? <UpcomingCard booking={upcoming} /> : <EmptyState />}

      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="text-ink-60 mb-4 overline">
          {t("quickActions")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickActionCard
            href="/vehicles"
            icon={<Car className="size-5" />}
            label={t("browseCars")}
          />
          <QuickActionCard
            href="/account/documents"
            icon={<FileText className="size-5" />}
            label={t("manageDocuments")}
          />
          <QuickActionCard
            href="/account/profile"
            icon={<UserCircle className="size-5" />}
            label={t("updateProfile")}
          />
        </div>
      </section>

      {recent.length > 0 ? (
        <section aria-labelledby="recent">
          <div className="flex items-baseline justify-between">
            <h2 id="recent" className="text-ink-60 mb-4 overline">
              {t("recentBookings")}
            </h2>
            <Link
              href="/account/bookings"
              className="label-lg text-ink-100 hover:text-ink-80 underline-offset-4 hover:underline"
            >
              {t("viewAll")} →
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {recent.map((b) => (
              <li key={b.ref}>
                <RecentBookingRow booking={b} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function UpcomingCard({ booking }: { booking: Booking }) {
  const t = useTranslations("accountPages.dashboard");
  const days = Math.max(0, differenceInCalendarDays(parseISO(booking.pickup.datetime), new Date()));
  const hero = booking.vehicleSnapshot.images[0];

  return (
    <Card variant="floating" className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {hero ? (
        <div className="bg-ink-10 relative aspect-[4/3] w-full overflow-hidden rounded-xl sm:w-48 sm:shrink-0">
          <Image src={hero.url} alt={hero.alt} fill sizes="200px" className="object-cover" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2">
        <span className="text-ink-100 overline">
          {days === 0 ? t("pickupToday") : t("pickupInDays", { days })}
        </span>
        <h2 className="headline-md text-ink-100">
          {booking.vehicleSnapshot.make} {booking.vehicleSnapshot.model}
        </h2>
        <p className="body-sm text-ink-60">
          {safeFormat(booking.pickup.datetime, "EEE, dd MMM · HH:mm")}
        </p>
        <p className="label-md text-ink-50">
          {t("ref")} · {booking.ref}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button asChild variant="primary" size="sm">
            <Link href={`/account/bookings/${booking.ref}`}>{t("viewDetails")}</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/account/bookings/${booking.ref}#modify`}>{t("modify")}</Link>
          </Button>
        </div>
      </div>
      <div className="sm:text-right">
        <span className="label-md text-ink-50">{t("total")}</span>
        <div className="price-md text-ink-100 mt-1">{formatUsd(booking.price.totalCents)}</div>
      </div>
    </Card>
  );
}

function RecentBookingRow({ booking }: { booking: Booking }) {
  return (
    <Link
      href={`/account/bookings/${booking.ref}`}
      className="border-border bg-paper hover:border-ink-100 flex items-center gap-4 rounded-xl border p-4 transition-colors"
    >
      <div className="flex flex-1 flex-col">
        <span className="headline-xs text-ink-100">
          {booking.vehicleSnapshot.make} {booking.vehicleSnapshot.model}
        </span>
        <span className="label-md text-ink-50 mt-1">
          {safeFormat(booking.pickup.datetime, "dd MMM")} →{" "}
          {safeFormat(booking.return.datetime, "dd MMM")} · {booking.ref}
        </span>
      </div>
      <div className="price-md text-ink-100 hidden sm:block">
        {formatUsd(booking.price.totalCents)}
      </div>
    </Link>
  );
}

function QuickActionCard({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bg-ink-10 hover:bg-paper hover:border-ink-100 focus-visible:outline-ink-100 group flex items-center gap-3 rounded-xl border border-transparent p-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span className="text-ink-100">{icon}</span>
      <span className="headline-xs text-ink-100">{label}</span>
    </Link>
  );
}

function EmptyState() {
  const t = useTranslations("accountPages.dashboard");
  return (
    <Card variant="tint" className="flex flex-col items-center gap-4 py-14 text-center">
      <span aria-hidden="true" className="text-5xl">
        🛣️
      </span>
      <h2 className="headline-md text-ink-100">{t("emptyHeading")}</h2>
      <p className="body-md text-ink-60 max-w-md">{t("emptyBody")}</p>
      <Button asChild variant="primary" size="md">
        <Link href="/vehicles">{t("browseCars")}</Link>
      </Button>
    </Card>
  );
}

function safeFormat(iso: string, pattern: string): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}
