"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ADD_ONS, PROTECTION_TIERS } from "@/lib/api/fixtures/catalog";
import { BRANCHES } from "@/lib/api/fixtures/branches";
import { formatUsd } from "@/lib/booking/pricing";
import type { AdditionalDriver, Booking, BookingState } from "@/types/domain";
import { Link } from "@/i18n/navigation";
import { formatDateTimeByLocale } from "@/lib/i18n/format";
import { DocumentScanPreview } from "@/components/account/DocumentScanPreview";

const STATE_BADGE: Record<
  BookingState,
  { labelKey: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  draft: { labelKey: "draft", variant: "neutral" },
  confirmed: { labelKey: "confirmed", variant: "new" },
  pending: { labelKey: "pendingVerification", variant: "pending" },
  expired: { labelKey: "expired", variant: "neutral" },
  cancelled: { labelKey: "cancelled", variant: "neutral" },
  completed: { labelKey: "completed", variant: "info" },
};

/**
 * Booking detail panel — the rich read-only view of a single booking.
 * Reused on manage-booking, account booking-detail, and admin booking detail.
 * Customer-facing guidance (pending next steps + cancellation policy link)
 * is hidden in the admin variant.
 */
export function BookingDetailPanel({
  booking,
  variant = "customer",
}: {
  booking: Booking;
  variant?: "customer" | "admin";
}) {
  const locale = useLocale();
  const tAccount = useTranslations("account");
  const tDetail = useTranslations("bookingDetail");
  const tSummary = useTranslations("bookingSummary");
  const hero = booking.vehicleSnapshot.images[0];
  const pickupBranch = BRANCHES.find((b) => b.id === booking.pickup.locationId);
  const returnBranch = BRANCHES.find((b) => b.id === booking.return.locationId);
  const tier = PROTECTION_TIERS.find((t) => t.id === booking.protectionTierId);
  const badge = STATE_BADGE[booking.state];
  const showGuidance = variant === "customer";

  return (
    <Card variant="floating" className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Badge variant={badge.variant}>{tAccount(badge.labelKey)}</Badge>
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
            <span className="body-sm text-ink-60 italic">{tDetail("orSimilar")}</span>
          </div>
          <div className="label-md text-ink-60 capitalize">
            {booking.vehicleSnapshot.category.replace("-", " ")}
          </div>
        </div>
      </div>

      <hr className="border-border" />

      <Section title={tDetail("pickup")}>
        <Address
          text={pickupBranch?.name ?? booking.pickup.address ?? "—"}
          datetime={booking.pickup.datetime}
          locale={locale}
        />
      </Section>
      <Section title={tDetail("return")}>
        <Address
          text={returnBranch?.name ?? booking.return.address ?? pickupBranch?.name ?? "—"}
          datetime={booking.return.datetime}
          locale={locale}
        />
      </Section>

      <hr className="border-border" />

      <Section title={tDetail("driver")}>
        <p className="body-md text-ink-100">
          {booking.driver.firstName} {booking.driver.lastName}
        </p>
        <p className="body-sm text-ink-60">
          {booking.driver.email} · {booking.driver.phone}
        </p>
      </Section>

      {booking.additionalDriver &&
      (booking.additionalDriver.firstName ||
        booking.additionalDriver.lastName ||
        booking.additionalDriver.licenceFrontUrl ||
        booking.additionalDriver.licenceBackUrl) ? (
        <Section title={tDetail("additionalDriver")}>
          <AdditionalDriverDetail driver={booking.additionalDriver} />
        </Section>
      ) : null}

      {booking.extras.length > 0 ? (
        <Section title={tDetail("addons")}>
          <ul className="body-sm text-ink-80 flex flex-col gap-1">
            {booking.extras.map((extra) => {
              const addOn = ADD_ONS.find((a) => a.id === extra.addOnId);
              return (
                <li key={extra.addOnId}>
                  {extra.qty > 1 ? `${extra.qty} × ` : ""}
                  {addOn?.name ?? extra.addOnId}
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}

      {tier ? (
        <Section title={tDetail("protection")}>
          <p className="body-md text-ink-100">{tier.name}</p>
        </Section>
      ) : null}

      <hr className="border-border" />

      <div id="booking-payment" className="flex flex-col gap-2 scroll-mt-24">
        <h3 className="text-ink-50 overline">{tDetail("total")}</h3>
        <dl className="body-sm text-ink-80 flex flex-col gap-2">
          <PriceLine label={tSummary("baseRate")} value={formatUsd(booking.price.baseRateCents)} />
          <PriceLine label={tSummary("addons")} value={formatUsd(booking.price.extrasCents)} />
          <PriceLine label={tSummary("protection")} value={formatUsd(booking.price.protectionCents)} />
          <PriceLine label={tSummary("fees")} value={formatUsd(booking.price.feesCents)} />
          <PriceLine label={tSummary("taxes11")} value={formatUsd(booking.price.taxesCents)} />
          <PriceLine label={tSummary("promoDiscount")} value={formatUsd(booking.price.discountCents)} />
          <PriceLine label={tDetail("total")} value={formatUsd(booking.price.totalCents)} emphasis />
          <PriceLine
            label={tSummary("depositAtPickup")}
            value={formatUsd(booking.price.depositCents)}
            muted
          />
        </dl>
      </div>

      {showGuidance && booking.state === "pending" ? <PendingNextSteps booking={booking} /> : null}

      {showGuidance ? (
        <Link
          href={`/help/cancellation-policy`}
          className="label-md text-ink-60 underline-offset-2 hover:underline"
        >
          {tDetail("cancellationPolicy")} →
        </Link>
      ) : null}
    </Card>
  );
}

export function AdditionalDriverDetail({ driver }: { driver: AdditionalDriver }) {
  const tDetail = useTranslations("bookingDetail");
  return (
    <>
      {driver.firstName || driver.lastName ? (
        <p className="body-md text-ink-100">
          {driver.firstName} {driver.lastName}
        </p>
      ) : null}
      {driver.licenceFrontUrl || driver.licenceBackUrl ? (
        <div className="mt-2 flex flex-wrap gap-3">
          {driver.licenceFrontUrl ? (
            <DocumentScanPreview
              scanUrl={driver.licenceFrontUrl}
              alt={tDetail("licenceFront")}
              size="md"
            />
          ) : null}
          {driver.licenceBackUrl ? (
            <DocumentScanPreview
              scanUrl={driver.licenceBackUrl}
              alt={tDetail("licenceBack")}
              size="md"
            />
          ) : null}
        </div>
      ) : null}
    </>
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

function PriceLine({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "headline-xs text-ink-100 flex items-baseline justify-between gap-3"
          : muted
            ? "text-ink-60 flex items-baseline justify-between gap-3"
            : "flex items-baseline justify-between gap-3"
      }
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Address({ text, datetime, locale }: { text: string; datetime: string; locale: string }) {
  return (
    <>
      <p className="body-md text-ink-100">{text}</p>
      <p className="body-sm text-ink-60">{formatDateTimeByLocale(datetime, locale)}</p>
    </>
  );
}

function PendingNextSteps({ booking }: { booking: Booking }) {
  const t = useTranslations("bookingDetail");
  const lines: string[] = [];
  if (booking.paymentMethod === "transfer") {
    lines.push(t("nextStepsTransfer"));
  }
  if (booking.paymentMethod === "omt") {
    lines.push(t("nextStepsOmt"));
  }
  // No generic “we'll WhatsApp you” line — outbound WhatsApp is not implemented.
  if (lines.length === 0) return null;

  return (
    <div className="bg-warning-bg text-warning flex flex-col gap-1 rounded-lg p-4">
      <div className="headline-xs">{t("nextSteps")}</div>
      <ul className="body-sm flex flex-col gap-1">
        {lines.map((line) => (
          <li key={line}>· {line}</li>
        ))}
      </ul>
    </div>
  );
}
