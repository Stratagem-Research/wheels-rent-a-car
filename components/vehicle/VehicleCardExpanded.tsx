"use client";

import * as React from "react";
import Link from "next/link";
import { X, DoorOpen, Users, Briefcase, Check, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SaveVehicleButton } from "@/components/vehicle/SaveVehicleButton";
import { VehicleImageSlider } from "@/components/vehicle/VehicleImageSlider";
import { formatUsd, perDayRate, rentalDays } from "@/lib/booking/pricing";
import {
  computeDeliveryFeeCents,
  DEFAULT_DELIVERY_PRICING_SETTINGS,
  nearestBranchDistanceKm,
} from "@/lib/booking/delivery-pricing";
import { FLEET_PAY_NOW_RATE } from "@/lib/vehicles/fleet-card-rates";
import { vehicleDisplayName } from "@/lib/vehicles/display-name";
import { whatsAppHref } from "@/lib/whatsapp";
import type {
  Branch,
  BookingPickup,
  DeliveryPricingSettings,
  MileagePlan,
  RateType,
  Vehicle,
  VehicleBadge,
} from "@/types/domain";

/**
 * VehicleCardExpanded — Sixt's "car selected" inline panel.
 *
 *  ┌──────────────────────────────────────────────────────┬──────────────────────────────┐
 *  │                                                      │                             × │
 *  │              [ vehicle hero photo ]                  │                              │
 *  │                                                      │  $18.46/day  $73.82 total    │
 *  │  TOYOTA YARIS                                        │                  [Next →]    │
 *  │  ▪ 5 Seats  ▪ 2 Bag(s)  ▪ Auto  ▪ 5 Doors            │                              │
 *  │  Minimum age of the youngest driver: 21              │                              │
 *  └──────────────────────────────────────────────────────┴──────────────────────────────┘
 *
 * Lives in a `col-span-2` cell on lg inside the /vehicles grid (the
 * collapsed VehicleCard widens into it on selection). Same radial gradient
 * surface as the collapsed card so the panel reads as a continuation.
 *
 * No payment-timing choice here — always the best-price bundle
 * (best-price + capped-200km, same as FLEET_PAY_NOW_RATE on the collapsed
 * card).
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
  /** Delivery distance fee shows when this is an "address-delivery" pickup with lat/lng. */
  pickup?: BookingPickup;
  branches?: Branch[];
  deliveryPricing?: DeliveryPricingSettings;
  onConfirm: (choice: { type: RateType; mileage: MileagePlan }) => void;
  onClose: () => void;
  className?: string;
}

export function VehicleCardExpanded({
  vehicle,
  pickupISO,
  returnISO,
  pickup,
  branches = [],
  deliveryPricing,
  onConfirm,
  onClose,
  className,
}: VehicleCardExpandedProps) {
  const t = useTranslations("fleet");
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
  const vehicleLabel = vehicleDisplayName(vehicle);

  // Same bundle as the collapsed card (best-price + 200 km/day).
  const perDay = perDayRate(vehicle, FLEET_PAY_NOW_RATE.type, FLEET_PAY_NOW_RATE.mileage);
  const isDelivery = pickup?.type === "address-delivery";
  const pricingSettings = deliveryPricing ?? DEFAULT_DELIVERY_PRICING_SETTINGS;
  const distanceKm =
    isDelivery && pickup?.lat !== undefined && pickup?.lng !== undefined
      ? nearestBranchDistanceKm({ lat: pickup.lat, lng: pickup.lng }, branches)
      : null;
  const deliveryCents = isDelivery
    ? computeDeliveryFeeCents(pickup, branches, deliveryPricing)
    : 0;
  const totalCents = perDay * days + deliveryCents;

  const fromPriceParts = splitPrice(perDay);
  const totalLabel = formatUsd(totalCents);
  const deliveryLabel = formatUsd(deliveryCents);

  const waLink = whatsAppHref("pdp", {
    model: vehicleLabel,
  });

  return (
    <article
      ref={panelRef}
      tabIndex={-1}
      aria-label={t("expandedAria", { vehicle: vehicleLabel })}
      className={cn(
        "text-paper relative grid overflow-hidden rounded-xl outline-none",
        "lg:grid-cols-[1.15fr_1fr]",
        "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      style={{ backgroundImage: CARD_GRADIENT_DARK }}
    >
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Link
          href={`/vehicles/${vehicle.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("pdpViewFullDetails")}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full",
            "text-paper bg-white/10 hover:bg-white/20",
            "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </Link>
        <SaveVehicleButton
          vehicleId={vehicle.id}
          vehicleLabel={vehicleLabel}
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
        <div className="relative">
          <VehicleImageSlider
            images={vehicle.images}
            dark
            sizes="(min-width: 1024px) 520px, 100vw"
            priority
            className="my-0"
          />
          {vehicle.badge ? (
            <div className="absolute top-0 left-0 z-20">
              <Badge variant={BADGE_VARIANT[vehicle.badge]}>{t(BADGE_KEY[vehicle.badge])}</Badge>
            </div>
          ) : null}
        </div>

        <header className="flex flex-col gap-1">
          <h3 className="headline-sm leading-tight">
            <span className="text-paper">{vehicleLabel}</span>
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

      {/* RIGHT — total + Next.
       *
       * Column is a flex-col with the footer pinned to the bottom via
       * mt-auto. Extra top padding on sm+ gives the content room to breathe
       * instead of crashing into the top edge. */}
      <div
        className={cn(
          "flex flex-col gap-5 border-t border-white/10 p-5 sm:p-7 sm:pt-16",
          "lg:border-t-0 lg:border-l lg:border-white/10",
        )}
      >
        {/* What's included — matches the 200 km/day plan shown on the card. */}
        <ul className="flex flex-col gap-2">
          <Benefit text={t("benefitMileage")} />
          <Benefit text={t("benefitCancellation")} />
          <Benefit text={t("benefitWhatsapp")} />
        </ul>

        {isDelivery ? (
          <div className="flex flex-col gap-1.5 rounded-lg bg-white/5 p-3.5">
            <h4 className="label-md text-paper/85 font-semibold">{t("deliveryDetailsTitle")}</h4>
            <DeliveryDetailRow
              label={t("deliveryDistance")}
              value={distanceKm !== null ? t("deliveryDistanceKm", { km: distanceKm.toFixed(2) }) : t("deliveryDistanceUnknown")}
            />
            {pricingSettings.freeRadiusKm > 0 ? (
              <DeliveryDetailRow
                label={t("deliveryBaseFee")}
                value={t("deliveryBaseFeeValue", {
                  price: formatUsd(pricingSettings.baseFeeCents),
                  km: pricingSettings.freeRadiusKm,
                })}
              />
            ) : null}
            <DeliveryDetailRow
              label={t("deliveryUnitPrice")}
              value={t("deliveryUnitPriceValue", { price: formatUsd(pricingSettings.perKmCents) })}
            />
            <DeliveryDetailRow
              label={t("deliveryTotalCost")}
              value={deliveryLabel}
              emphasize
            />
          </div>
        ) : null}

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
          <Button variant="cta" onClick={() => onConfirm(FLEET_PAY_NOW_RATE)}>
            {t("bookNow")} →
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

function DeliveryDetailRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="body-sm flex items-center justify-between gap-3">
      <span className="text-paper/70">{label}</span>
      <span className={cn("tabular-nums", emphasize ? "text-paper font-semibold" : "text-paper/85")}>
        {value}
      </span>
    </div>
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
