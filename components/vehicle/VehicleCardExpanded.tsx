"use client";

import * as React from "react";
import Image from "next/image";
import { X, DoorOpen, Users, Briefcase, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SaveVehicleButton } from "@/components/vehicle/SaveVehicleButton";
import { RadioGroup, RadioItem } from "@/components/ui/RadioGroup";
import { formatUsd, perDayRate, rentalDays } from "@/lib/booking/pricing";
import { FLEET_PAY_LATER_RATE, FLEET_PAY_NOW_RATE } from "@/lib/vehicles/fleet-card-rates";
import { whatsAppHref } from "@/lib/whatsapp";
import type { MileagePlan, RateType, Vehicle, VehicleBadge } from "@/types/domain";

/**
 * VehicleCardExpanded — Sixt's "car selected" inline panel.
 *
 *  ┌──────────────────────────────────────────────────────┬──────────────────────────────┐
 *  │                                                      │  Payment option            × │
 *  │                                                      │  ○ Pay now      Best price   │
 *  │              [ vehicle hero photo ]                  │  ○ Pay later    +$3.90/day   │
 *  │                                                      │                              │
 *  │  TOYOTA YARIS  or similar                            │  $18.46/day  $73.82 total    │
 *  │  ▪ 5 Seats  ▪ 2 Bag(s)  ▪ Auto  ▪ 5 Doors            │                  [Next →]    │
 *  │  Minimum age of the youngest driver: 21              │                              │
 *  └──────────────────────────────────────────────────────┴──────────────────────────────┘
 *
 * Lives in a `col-span-2` cell on lg inside the /vehicles grid (the
 * collapsed VehicleCard widens into it on selection). Same radial gradient
 * surface as the collapsed card so the panel reads as a continuation.
 *
 * Right column was previously two sections — "Booking option" (best-price /
 * flexible) and "Mileage" (200km / unlimited). Both collapsed into a single
 * "Payment option" panel: Pay Now (the cheaper bundle — best-price +
 * capped-200km) vs Pay Later (slight surcharge — flexible + capped-200km).
 * Cleaner read, same downstream booking-draft shape (rate + mileage are
 * still what the callback sends, derived from the payment-timing choice).
 *
 * - Red `cta` "Next →" → confirms rate + mileage and routes to /book/extras.
 * - × top-right strips `?selected=` from the URL.
 */

const BADGE_KEY: Record<NonNullable<VehicleBadge>, string> = {
  "best-deal": "badgeBestDeal",
  popular: "badgePopular",
  new: "badgeNew",
};

const BADGE_VARIANT: Record<
  NonNullable<VehicleBadge>,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  "best-deal": "bestDeal",
  popular: "popular",
  new: "new",
};

/** Single source of truth: --gradient-card-dark in styles/tokens.css. */
const CARD_GRADIENT_DARK = "var(--gradient-card-dark)";

export interface VehicleCardExpandedProps {
  vehicle: Vehicle;
  pickupISO: string;
  returnISO: string;
  onConfirm: (choice: { type: RateType; mileage: MileagePlan }) => void;
  onClose: () => void;
  className?: string;
}

/**
 * Pay-now / pay-later is a UI-layer concept that maps to the existing
 * (rate × mileage) pricing matrix:
 *
 *   pay-now   → best-price + capped-200km   (the cheaper bundle)
 *   pay-later → flexible   + capped-200km   (slight surcharge)
 *
 * Mileage stays at the default 200km/day for both. The downstream booking
 * draft still receives `{ type: RateType; mileage: MileagePlan }` so no
 * other code in the funnel needs to change.
 */
type PaymentTiming = "pay-now" | "pay-later";

const PAYMENT_TIMING_TO_BOOKING: Record<PaymentTiming, { type: RateType; mileage: MileagePlan }> = {
  "pay-now": FLEET_PAY_NOW_RATE,
  "pay-later": FLEET_PAY_LATER_RATE,
};

export function VehicleCardExpanded({
  vehicle,
  pickupISO,
  returnISO,
  onConfirm,
  onClose,
  className,
}: VehicleCardExpandedProps) {
  const t = useTranslations("fleet");
  const [paymentTiming, setPaymentTiming] = React.useState<PaymentTiming>("pay-now");
  const panelRef = React.useRef<HTMLElement>(null);

  // Focus + pin the panel under sticky chrome. Instant scroll only — smooth
  // scrollIntoView raced layout when switching cars and landed at the bottom.
  React.useLayoutEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });

    const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    const searchBottom =
      document.querySelector<HTMLElement>("[data-vehicles-sticky-search]")?.getBoundingClientRect()
        .bottom ?? 0;
    const clearance = Math.max(headerBottom, searchBottom) + 12;
    const rect = node.getBoundingClientRect();
    // Skip scroll when the panel already sits comfortably under sticky chrome
    // (same-row switches). Otherwise pin its top under the sticky band.
    if (rect.top >= clearance - 8 && rect.top <= window.innerHeight * 0.45) return;

    window.scrollTo({
      top: Math.max(0, rect.top + window.scrollY - clearance),
      behavior: "auto",
    });
  }, [vehicle.id]);

  const days = rentalDays(pickupISO, returnISO);
  const image = vehicle.images[0];

  // Same bundles as the collapsed card (best-price + 200 km/day vs flexible).
  const payNowPerDay = perDayRate(
    vehicle,
    FLEET_PAY_NOW_RATE.type,
    FLEET_PAY_NOW_RATE.mileage,
  );
  const payLaterPerDay = perDayRate(
    vehicle,
    FLEET_PAY_LATER_RATE.type,
    FLEET_PAY_LATER_RATE.mileage,
  );
  const payLaterSurchargeCents = payLaterPerDay - payNowPerDay;

  const perDay = paymentTiming === "pay-now" ? payNowPerDay : payLaterPerDay;
  const totalCents = perDay * days;

  const fromPriceParts = splitPrice(perDay);
  const totalLabel = formatUsd(totalCents);

  const waLink = whatsAppHref("pdp", {
    model: `${vehicle.make} ${vehicle.model}`,
  });

  return (
    <article
      ref={panelRef}
      tabIndex={-1}
      aria-label={t("expandedAria", { vehicle: `${vehicle.make} ${vehicle.model}` })}
      className={cn(
        "text-paper relative grid overflow-hidden rounded-xl outline-none",
        "lg:grid-cols-[1.15fr_1fr]",
        "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      style={{ backgroundImage: CARD_GRADIENT_DARK }}
    >
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <SaveVehicleButton
          vehicleId={vehicle.id}
          vehicleLabel={`${vehicle.make} ${vehicle.model}`}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeAria")}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full",
            "text-paper bg-white/10 hover:bg-white/20",
            "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* LEFT — vehicle hero photo + below-photo specs. */}
      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <div className="relative aspect-[16/10] w-full">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-contain"
              priority
            />
          ) : null}
          {vehicle.badge ? (
            <div className="absolute top-0 left-0">
              <Badge variant={BADGE_VARIANT[vehicle.badge]}>{t(BADGE_KEY[vehicle.badge])}</Badge>
            </div>
          ) : null}
        </div>

        <header className="flex flex-col gap-1">
          <h3 className="headline-sm flex flex-wrap items-baseline gap-x-2 leading-tight">
            <span className="text-paper">
              {vehicle.make} {vehicle.model}
            </span>
            <span className="body-sm text-paper/55 italic">{t("orSimilar")}</span>
          </h3>
        </header>

        {/* Spec row — same Lucide icons as VehicleCard so the collapsed and
         * expanded states read identically. No emoji. */}
        <ul className="label-md text-paper/85 flex flex-wrap items-center gap-x-5 gap-y-2">
          <SpecRow
            label={t("seatsLabel", { count: vehicle.seats })}
            icon={<Users className="size-3.5" aria-hidden="true" />}
          />
          <SpecRow
            label={t("bagsLabel", { count: vehicle.bags })}
            icon={<Briefcase className="size-3.5" aria-hidden="true" />}
          />
          <SpecRow
            label={t(vehicle.transmission === "automatic" ? "transAutomatic" : "transManual")}
            icon={<AutoBadge />}
          />
          <SpecRow
            label={t("doorsLabel", { count: vehicle.doors })}
            icon={<DoorOpen className="size-3.5" aria-hidden="true" />}
          />
        </ul>

        <p className="label-sm text-paper/60">{t("minAge")}</p>
      </div>

      {/* RIGHT — payment option + total + Next.
       *
       * Column is a flex-col with the footer pinned to the bottom via
       * mt-auto. Extra top padding on sm+ gives the PAYMENT OPTION label
       * room to breathe instead of crashing into the top edge. */}
      <div
        className={cn(
          "flex flex-col gap-5 border-t border-white/10 p-5 sm:p-7 sm:pt-10",
          "lg:border-t-0 lg:border-l lg:border-white/10",
        )}
      >
        <Panel title={t("paymentOption")}>
          <RadioGroup
            value={paymentTiming}
            onValueChange={(v) => setPaymentTiming(v as PaymentTiming)}
            aria-label={t("paymentOption")}
          >
            <RadioRow
              value="pay-now"
              selected={paymentTiming === "pay-now"}
              title={t("payNow")}
              description={t("payNowDesc")}
              priceLabel={t("bestPrice")}
              badge={<Badge variant="popular">{t("badgePopular")}</Badge>}
            />
            <RadioRow
              value="pay-later"
              selected={paymentTiming === "pay-later"}
              title={t("payLater")}
              description={t("payLaterDesc")}
              priceLabel={t("perDaySurcharge", { price: formatUsd(payLaterSurchargeCents) })}
            />
          </RadioGroup>
        </Panel>

        {/* What's included — matches the 200 km/day plan shown on the card. */}
        <ul className="flex flex-col gap-2">
          <Benefit text={t("benefitMileage")} />
          <Benefit text={t("benefitCancellation")} />
          <Benefit text={t("benefitWhatsapp")} />
        </ul>

        {/* mt-auto pushes the price + Next CTA all the way to the bottom of
         * the right column — so even on lg, where the column stretches to
         * match the left photo height, the footer reads as a checkout band
         * instead of floating mid-column. */}
        <footer className="mt-auto flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="price-md text-paper tabular-nums">
                <span className="text-[1.25em] font-extrabold">${fromPriceParts.dollars}</span>
                <span className="font-bold">.{fromPriceParts.cents}</span>{" "}
              <span className="body-sm text-paper/85 font-medium">{t("perDay")}</span>
            </span>
            <span className="body-sm text-paper/55 tabular-nums">
              {t("total", { price: totalLabel })}
            </span>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="label-md text-paper/70 hover:text-paper inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            {t("askWhatsapp")} →
          </a>
        </div>
        <Button variant="cta" onClick={() => onConfirm(PAYMENT_TIMING_TO_BOOKING[paymentTiming])}>
          {t("next")} →
        </Button>
        </footer>
      </div>
    </article>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────── */

function Benefit({ text }: { text: string }) {
  return (
    <li className="body-sm text-paper/85 flex items-center gap-2">
      <Check className="text-success size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      {text}
    </li>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h4 className="headline-xs text-paper">{title}</h4>
      {children}
    </div>
  );
}

function RadioRow({
  value,
  selected,
  title,
  description,
  priceLabel,
  badge,
}: {
  value: string;
  selected: boolean;
  title: string;
  description: string;
  priceLabel: string;
  badge?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors",
        selected ? "border-paper bg-white/10" : "border-white/15 bg-transparent hover:bg-white/5",
      )}
    >
      <RadioItem value={value} className="mt-0.5" />
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="body-md text-paper inline-flex items-center gap-2 font-semibold">
            {title}
            {badge ?? null}
          </span>
          <span className="label-md text-paper/85 tabular-nums">{priceLabel}</span>
        </div>
        <span className="body-sm text-paper/60">{description}</span>
      </div>
    </label>
  );
}

function SpecRow({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      {icon}
      <span>{label}</span>
    </li>
  );
}

function AutoBadge() {
  return (
    <span
      aria-hidden="true"
      className="label-sm bg-paper/15 text-paper flex size-4 items-center justify-center rounded-[3px] leading-none"
    >
      A
    </span>
  );
}

function splitPrice(cents: number): { dollars: string; cents: string } {
  const dollars = Math.floor(cents / 100);
  const remainder = Math.round(cents % 100);
  return { dollars: String(dollars), cents: String(remainder).padStart(2, "0") };
}
