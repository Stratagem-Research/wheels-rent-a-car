"use client";

import Link from "next/link";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { formatUsd } from "@/lib/booking/pricing";
import type { Booking, BookingState } from "@/types/domain";

const STATE_BADGE: Record<
  BookingState,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  draft: { label: "Draft", variant: "neutral" },
  confirmed: { label: "Confirmed", variant: "new" },
  pending: { label: "Pending", variant: "pending" },
  expired: { label: "Expired", variant: "neutral" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  completed: { label: "Completed", variant: "info" },
};

export function BookingHistoryRow({ booking }: { booking: Booking }) {
  const hero = booking.vehicleSnapshot.images[0];
  const badge = STATE_BADGE[booking.state];

  return (
    <Link
      href={`/account/bookings/${booking.ref}`}
      className={cn(
        "border-border bg-paper flex flex-col gap-4 rounded-xl border p-5",
        "hover:border-ink-100 transition-colors",
        "sm:flex-row sm:items-center sm:gap-5",
      )}
    >
      {hero ? (
        <div className="bg-ink-10 relative aspect-[4/3] w-full overflow-hidden rounded-lg sm:size-20 sm:shrink-0">
          <Image src={hero.url} alt={hero.alt} fill sizes="80px" className="object-cover" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className="mono-md text-ink-50">{booking.ref}</span>
        </div>
        <div className="headline-xs text-ink-100">
          {booking.vehicleSnapshot.make} {booking.vehicleSnapshot.model}
        </div>
        <div className="label-md text-ink-50">
          {safeFormat(booking.pickup.datetime, "dd MMM HH:mm")} →{" "}
          {safeFormat(booking.return.datetime, "dd MMM HH:mm")}
        </div>
      </div>
      <div className="price-md text-ink-100">{formatUsd(booking.price.totalCents)}</div>
    </Link>
  );
}

function safeFormat(iso: string, pattern: string): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}
