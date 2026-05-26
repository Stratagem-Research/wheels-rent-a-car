"use client";

import Link from "next/link";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ADD_ONS, PROTECTION_TIERS } from "@/lib/api/mocks/fixtures/catalog";
import { BRANCHES } from "@/lib/api/mocks/fixtures/branches";
import { formatUsd } from "@/lib/booking/pricing";
import type { Booking, BookingState } from "@/types/domain";

const STATE_BADGE: Record<
  BookingState,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  draft: { label: "Draft", variant: "neutral" },
  confirmed: { label: "Confirmed", variant: "new" },
  pending: { label: "Pending verification", variant: "pending" },
  expired: { label: "Expired", variant: "neutral" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  completed: { label: "Completed", variant: "info" },
};

/**
 * Booking detail panel — the rich read-only view of a single booking.
 * Reused on the confirmation page (Sprint 6), manage-booking (Sprint 8),
 * and the account booking-detail route below.
 */
export function BookingDetailPanel({ booking }: { booking: Booking }) {
  const hero = booking.vehicleSnapshot.images[0];
  const pickupBranch = BRANCHES.find((b) => b.id === booking.pickup.locationId);
  const returnBranch = BRANCHES.find((b) => b.id === booking.return.locationId);
  const tier = PROTECTION_TIERS.find((t) => t.id === booking.protectionTierId);
  const badge = STATE_BADGE[booking.state];

  return (
    <Card variant="floating" className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <span className="mono-md text-ink-50">{booking.ref}</span>
      </div>

      <div className="flex items-center gap-4">
        {hero ? (
          <div className="bg-ink-10 relative size-20 shrink-0 overflow-hidden rounded-lg">
            <Image src={hero.url} alt={hero.alt} fill sizes="80px" className="object-cover" />
          </div>
        ) : null}
        <div>
          <div className="headline-sm text-ink-100">
            {booking.vehicleSnapshot.make} {booking.vehicleSnapshot.model}{" "}
            <span className="body-sm text-ink-60 italic">or similar</span>
          </div>
          <div className="label-md text-ink-60 capitalize">
            {booking.vehicleSnapshot.category.replace("-", " ")}
          </div>
        </div>
      </div>

      <hr className="border-border" />

      <Section title="Pickup">
        <Address
          text={pickupBranch?.name ?? booking.pickup.address ?? "—"}
          datetime={booking.pickup.datetime}
        />
      </Section>
      <Section title="Return">
        <Address
          text={returnBranch?.name ?? booking.return.address ?? pickupBranch?.name ?? "—"}
          datetime={booking.return.datetime}
        />
      </Section>

      <hr className="border-border" />

      <Section title="Driver">
        <p className="body-md text-ink-100">
          {booking.driver.firstName} {booking.driver.lastName}
        </p>
        <p className="body-sm text-ink-60">
          {booking.driver.email} · {booking.driver.phone}
        </p>
      </Section>

      {booking.extras.length > 0 ? (
        <Section title="Add-ons">
          <ul className="body-sm text-ink-80 flex flex-col gap-1">
            {booking.extras.map((extra) => {
              const addOn = ADD_ONS.find((a) => a.id === extra.addOnId);
              if (!addOn) return null;
              return (
                <li key={extra.addOnId}>
                  {extra.qty > 1 ? `${extra.qty} × ` : ""}
                  {addOn.name}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {tier ? (
        <Section title="Protection">
          <p className="body-md text-ink-100">{tier.name}</p>
        </Section>
      ) : null}

      <hr className="border-border" />

      <div className="flex items-baseline justify-between">
        <span className="headline-xs text-ink-100">Total</span>
        <span className="price-lg text-ink-100">{formatUsd(booking.price.totalCents)}</span>
      </div>

      {booking.state === "pending" ? <PendingNextSteps booking={booking} /> : null}

      <Link
        href={`/help/cancellation-policy`}
        className="label-md text-ink-60 underline-offset-2 hover:underline"
      >
        Cancellation policy →
      </Link>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-ink-50 mb-1 overline">{title}</h3>
      {children}
    </div>
  );
}

function Address({ text, datetime }: { text: string; datetime: string }) {
  return (
    <>
      <p className="body-md text-ink-100">{text}</p>
      <p className="body-sm text-ink-60">{safeFormat(datetime, "EEE, dd MMM yyyy · HH:mm")}</p>
    </>
  );
}

function PendingNextSteps({ booking }: { booking: Booking }) {
  const lines: string[] = [];
  if (booking.paymentMethod === "transfer") {
    lines.push("Send your bank transfer if you haven't yet. We confirm within 24h.");
  }
  if (booking.paymentMethod === "omt") {
    lines.push("Pay at any OMT, Whish, or Bob Finance branch using your reference.");
  }
  if (lines.length === 0) {
    lines.push("We'll WhatsApp you once payment is verified.");
  }
  return (
    <div className="bg-warning-bg text-warning flex flex-col gap-1 rounded-lg p-4">
      <div className="headline-xs">Next steps</div>
      <ul className="body-sm flex flex-col gap-1">
        {lines.map((line) => (
          <li key={line}>· {line}</li>
        ))}
      </ul>
    </div>
  );
}

function safeFormat(iso: string, pattern: string): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}
