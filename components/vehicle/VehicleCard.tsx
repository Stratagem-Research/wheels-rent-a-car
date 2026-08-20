"use client";

import * as React from "react";
import Link from "next/link";
import { Briefcase, Check, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { SaveVehicleButton } from "@/components/vehicle/SaveVehicleButton";
import { VehicleImageSlider } from "@/components/vehicle/VehicleImageSlider";
import { formatUsd, perDayRate, rentalDays } from "@/lib/booking/pricing";
import { FLEET_PAY_NOW_RATE } from "@/lib/vehicles/fleet-card-rates";
import { vehicleDisplayName } from "@/lib/vehicles/display-name";
import type { Vehicle, VehicleBadge } from "@/types/domain";

/*
 * Vehicle card — Sixt-aesthetic rewrite.
 *
 * DARK card by default — a radial gradient (lighter at top-center, fading
 * to ink-95 at the edges) so the vehicle silhouette photographs read like
 * a studio shot, per the Sixt reference. The whole card is one Link — there
 * is no separate "Select" button.
 *
 * Layout choices:
 *   - Title alone in the header (no second "Mini Sedan Automatic" line) —
 *     the class chip carries the same information cleaner.
 *   - Class chip sits at the TOP next to the title; the seats/bags/transmission
 *     spec chips sit right below it. Single chip rhythm.
 *   - The Popular / Best-deal / New badge sits at the BOTTOM of the card next
 *     to the price, NOT overlaying the photo — keeps the photo clean.
 *
 * Selected state: 2px signal-red ring + a CSS-triangle pointer at the bottom
 * edge of the card pointing DOWNWARD, anchoring the expanded panel
 * (`VehicleCardExpanded`) that sits in the next grid row.
 *
 * `variant="light"` flips the surface to paper for contexts where a sea of
 * dark cards would feel heavy (e.g. the long-term "Cars our clients love"
 * carousel).
 *
 * `scrollOnClick={false}` is set by the /vehicles results grid so clicking
 * a card to expand it doesn't jump the page to the top.
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

type Variant = "default" | "light";

export interface VehicleCardProps {
  vehicle: Vehicle;
  variant?: Variant;
  /** Active "selected" state — 2px signal-red ring + chevron pointer. */
  selected?: boolean;
  /** Override the link href (e.g. carry the current search query). */
  href?: string;
  /** Pickup/return ISO strings, used to compute the per-day rate at the
   * default best-price + 200-km plan. When omitted, falls back to the
   * raw `dailyRateFromCents` (still per day). */
  pickupISO?: string;
  returnISO?: string;
  /** When false, the Link suppresses Next.js's default scroll-to-top after
   * navigation. Set this when the card is staying on the same page (the
   * /vehicles results grid), so clicking to expand doesn't jump scroll. */
  scrollOnClick?: boolean;
  /** Inventory units of this model currently available (fleet listing). */
  availableCount?: number;
  className?: string;
}

export function VehicleCard({
  vehicle,
  variant = "default",
  selected = false,
  href,
  pickupISO,
  returnISO,
  scrollOnClick = true,
  availableCount,
  className,
}: VehicleCardProps) {
  const t = useTranslations("fleet");
  const detailHref = href ?? `/vehicles?selected=${encodeURIComponent(vehicle.id)}`;
  const dark = variant === "default";
  const vehicleLabel = vehicleDisplayName(vehicle);

  // Per-day rate at the best-price + 200-km plan (matches the default
  // selection in VehicleCardExpanded). Falls back to the raw daily rate
  // when no search dates are in context (home featured-4, long-term
  // carousel, etc.).
  const perDay =
    pickupISO && returnISO
      ? perDayRate(vehicle, FLEET_PAY_NOW_RATE.type, FLEET_PAY_NOW_RATE.mileage)
      : vehicle.dailyRateFromCents;
  const days = pickupISO && returnISO ? rentalDays(pickupISO, returnISO) : 1;
  const totalCents = perDay * days;
  const fromPriceParts = splitPrice(perDay);
  const totalLabel = pickupISO && returnISO ? formatUsd(totalCents) : null;

  const classChip = t(bodyClassKey(vehicle));

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl transition-shadow duration-200",
        dark ? "bg-ink-95 text-paper" : "bg-paper text-ink-95 border-border border",
        selected && "outline-signal-red outline outline-2 outline-offset-0",
        className,
      )}
      style={dark ? { backgroundImage: CARD_GRADIENT_DARK } : undefined}
    >
      <SaveVehicleButton
        vehicleId={vehicle.id}
        vehicleLabel={vehicleLabel}
        inverse={dark}
        className="absolute top-4 right-4 z-10"
      />
      <Link
        href={detailHref}
        scroll={scrollOnClick}
        aria-label={t("selectAria", { vehicle: vehicleLabel })}
        className={cn(
          "flex flex-col gap-4 p-5 pb-0 sm:p-6 sm:pb-0",
          "focus-visible:rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
          dark ? "focus-visible:outline-paper" : "focus-visible:outline-ink-100",
        )}
      >
        {/* Title row — make + model, with the body class (e.g. "Economy
         * sedan") as a plain uppercase subtitle below. The old chip-pill
         * treatment around the class felt like an extra chrome element
         * competing with the spec chips below; a quiet label-md subtitle
         * reads cleaner and gives the title block a single, ordered
         * hierarchy: make/model → class → specs. */}
        <header className="flex flex-col gap-1">
          <h3
            className={cn(
              "headline-md leading-[1.05] font-extrabold tracking-[-0.01em]",
              dark ? "text-paper" : "text-ink-95",
            )}
          >
            {vehicleLabel}
          </h3>
          <span
            className={cn(
              "label-md tracking-[0.1em] uppercase",
              dark ? "text-paper/60" : "text-ink-50",
            )}
          >
            {classChip}
          </span>
          {availableCount != null ? (
            <span className={cn("body-sm mt-1", dark ? "text-paper/75" : "text-ink-60")}>
              {t("availableCount", { count: availableCount })}
            </span>
          ) : null}
        </header>

        {/* Compact chip row — Sixt-style: just icon + value, no label noise. */}
        <ul className="flex flex-wrap items-center gap-1.5">
          <Chip
            dark={dark}
            icon={<Users className="size-3.5" aria-hidden="true" />}
            label={String(vehicle.seats)}
          />
          <Chip
            dark={dark}
            icon={<Briefcase className="size-3.5" aria-hidden="true" />}
            label={String(vehicle.bags)}
          />
          <Chip
            dark={dark}
            icon={
              <span
                className={cn(
                  "label-sm flex size-3.5 items-center justify-center rounded-[3px] leading-none",
                  dark ? "bg-paper/15 text-paper" : "bg-ink-10 text-ink-80",
                )}
                aria-hidden="true"
              >
                A
              </span>
            }
            label={t(vehicle.transmission === "automatic" ? "transAutomatic" : "transManual")}
          />
        </ul>
      </Link>

      <div className="px-5 sm:px-6">
        <VehicleImageSlider
          images={vehicle.images}
          dark={dark}
          href={detailHref}
          scroll={scrollOnClick}
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      <Link
        href={detailHref}
        scroll={scrollOnClick}
        tabIndex={-1}
        className={cn(
          "flex flex-1 flex-col justify-end gap-4 p-5 pt-2 sm:p-6 sm:pt-2",
          "focus-visible:rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
          dark ? "focus-visible:outline-paper" : "focus-visible:outline-ink-100",
        )}
      >
        {/* Unlimited-km availability — green check + paper text. */}
        <div className="flex items-center gap-2">
          <Check
            className={cn("size-4 shrink-0", dark ? "text-success" : "text-success")}
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span className={cn("body-sm", dark ? "text-paper/85" : "text-ink-80")}>
            {t("payLaterAvailable")}
          </span>
        </div>

        {/* Price row + badge at the BOTTOM. Dollar amount upsized to 1.5em
         * Extra Bold so the price reads first at any glance distance. */}
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className={cn("price-md tabular-nums", dark ? "text-paper" : "text-ink-95")}>
              <span className="text-[1.5em] font-extrabold tracking-[-0.02em]">
                ${fromPriceParts.dollars}
              </span>
              <span className="font-extrabold">.{fromPriceParts.cents}</span>{" "}
              <span className={cn("body-sm font-medium", dark ? "text-paper/85" : "text-ink-80")}>
                {t("perDay")}
              </span>
            </span>
            {totalLabel ? (
              <span className={cn("body-sm tabular-nums", dark ? "text-paper/55" : "text-ink-50")}>
                {t("total", { price: totalLabel })}
              </span>
            ) : null}
          </div>
          {vehicle.badge ? (
            <Badge variant={BADGE_VARIANT[vehicle.badge]}>{t(BADGE_KEY[vehicle.badge])}</Badge>
          ) : null}
        </div>
      </Link>

      {/* Pointer-down chevron when selected — a CSS triangle pointing DOWN
       * (apex below the card, base flush with the card's bottom edge). The
       * old diamond-rotation looked like an upward-pointing apex; this one
       * unambiguously points at the expanded panel sitting below. */}
      {selected ? (
        <div
          aria-hidden="true"
          className={cn(
            "absolute -bottom-[10px] left-1/2 z-10 -translate-x-1/2",
            "size-0 border-x-8 border-x-transparent",
            "border-t-signal-red border-t-[10px]",
          )}
        />
      ) : null}
    </article>
  );
}

/* ── helpers ─────────────────────────────────────────────────────────── */

function Chip({ dark, icon, label }: { dark: boolean; icon: React.ReactNode; label: string }) {
  return (
    <li
      className={cn(
        "label-sm rounded-pill inline-flex items-center gap-1.5 px-2.5 py-1 capitalize",
        dark ? "bg-paper/10 text-paper" : "bg-ink-10 text-ink-80",
      )}
    >
      {icon}
      {label}
    </li>
  );
}

function splitPrice(cents: number): { dollars: string; cents: string } {
  const dollars = Math.floor(cents / 100);
  const remainder = Math.round(cents % 100);
  return { dollars: String(dollars), cents: String(remainder).padStart(2, "0") };
}

/** Sixt-style class badge: combines size class + body shape. Returns a key
 * into the `fleet` message namespace so the label localizes. */
function bodyClassKey(v: Vehicle): string {
  switch (v.category) {
    case "economy":
      return v.doors === 5 ? "classStandardHatch" : "classEconomySedan";
    case "compact":
      return v.doors === 5 ? "classCompactHatch" : "classCompactSedan";
    case "sedan":
      return "classStandardSedan";
    case "suv":
      return "classCompactSuv";
    case "4x4":
      return "classOffroad4x4";
    case "luxury":
      return "classLuxurySuv";
    case "7-seater":
      return "classSevenSeater";
    case "convertible":
      return "classConvertible";
    default:
      return "classStandardSedan";
  }
}
