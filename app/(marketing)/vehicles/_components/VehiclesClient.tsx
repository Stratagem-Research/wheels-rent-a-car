"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { useMotionGate } from "@/lib/motion/useMotionGate";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SearchBar } from "@/components/search/SearchBar";
import { Stepper } from "@/components/booking/Stepper";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { VehicleCardExpanded } from "@/components/vehicle/VehicleCardExpanded";
import {
  applyFilters,
  computeFacets,
  parseFiltersFromSearch,
  sortFiltered,
} from "@/lib/vehicles/filter";
import { seedDraftFromSearchParams, useBookingDraft } from "@/hooks/useBookingDraft";
import { appendSearchContextFromParams, draftToSearchParams } from "@/lib/booking/draft-to-search-params";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import type { MileagePlan, RateType, Vehicle, VehicleCategory, Branch } from "@/types/domain";

/**
 * /vehicles — INK & SIGNAL canonical results page (Phase 7).
 *
 * Replaces both the legacy /vehicles listing and the /vehicles/[slug] PDP.
 * Sixt-style inline expansion: clicking a card pushes `?selected=<slug>`,
 * which expands that card into a `<VehicleCardExpanded />` panel in place
 * (spans 2 cols on lg).
 *
 * Modes:
 *   - Browse:  default URL `/vehicles`. Categories filtered via `?category=`.
 *   - Step 1:  `/vehicles?step=1` (entered from `/book/select-vehicle`).
 *              Renders the booking Stepper above the toolbar; NEXT routes
 *              to `/book/extras` after writing the choice into the draft.
 *
 * URL surface:
 *   ?step=1                 booking-step-1 mode
 *   ?selected=<slug>        auto-expand the matching card
 *   ?sort=price-asc         toolbar "Lowest price" toggle
 *   ?transmission=automatic toolbar "Auto only" toggle
 *   ?category=<slug>        category lock (also driven by FilterSidebar)
 *   ?guaranteed=1           "Guaranteed model" toggle (Phase-1 stub)
 */

export function VehiclesClient({
  vehicles,
  branches,
  availabilityError = false,
}: {
  vehicles: Vehicle[];
  branches: Branch[];
  availabilityError?: boolean;
}) {
  const t = useTranslations("vehicles");
  const tCat = useTranslations("vehicleCategories");
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const searchParams = React.useMemo(
    () => new URLSearchParams(searchParamsHook?.toString() ?? ""),
    [searchParamsHook],
  );

  const filters = parseFiltersFromSearch(searchParams);
  const facets = React.useMemo(() => computeFacets(vehicles), [vehicles]);
  const filtered = React.useMemo(
    () => sortFiltered(applyFilters(vehicles, filters), filters.sort),
    [vehicles, filters],
  );

  const isStep1 = searchParams.get("step") === "1";
  const selectedSlug = searchParams.get("selected");

  const { ready, draft, setPickup, setReturn, setDraft } = useBookingDraft();

  // Seed / sync draft pickup+return from URL search params (SearchBar → funnel).
  React.useEffect(() => {
    if (!ready || !draft) return;
    const pickupAt = searchParams.get("pickupAt");
    const returnAt = searchParams.get("returnAt");
    if (!pickupAt || !returnAt) return;

    const pickupTypeParam = searchParams.get("pickupType");
    const pickupType =
      pickupTypeParam === "airport" ||
      pickupTypeParam === "branch" ||
      pickupTypeParam === "address-delivery" ||
      pickupTypeParam === "chauffeur"
        ? pickupTypeParam
        : draft.pickup.type;
    const pickupLoc = searchParams.get("pickupLoc") ?? draft.pickup.locationId;
    const pickupAddr = searchParams.get("pickupAddr") ?? draft.pickup.address;
    const returnLoc = searchParams.get("returnLoc") ?? draft.return.locationId;
    const returnAddr = searchParams.get("returnAddr") ?? draft.return.address;
    const promo = searchParams.get("promo") ?? draft.promoCode;

    const unchanged =
      draft.pickup.datetime === pickupAt &&
      draft.return.datetime === returnAt &&
      draft.pickup.type === pickupType &&
      draft.pickup.locationId === pickupLoc &&
      draft.pickup.address === pickupAddr &&
      draft.return.locationId === returnLoc &&
      draft.return.address === returnAddr &&
      draft.promoCode === promo;

    if (unchanged) return;

    setPickup({
      type: pickupType,
      locationId: pickupLoc,
      address: pickupAddr,
      datetime: pickupAt,
    });
    setReturn({
      locationId: returnLoc,
      address: returnAddr,
      datetime: returnAt,
    });
    if (promo !== draft.promoCode) {
      setDraft((prev) => ({ ...prev, promoCode: promo }));
    }
  }, [ready, draft, searchParams, setPickup, setReturn, setDraft]);

  // Step 1 must filter against live availability — push draft dates into the
  // URL when missing so the server re-renders the date-scoped fleet list.
  React.useEffect(() => {
    if (!ready || !draft || !isStep1) return;
    const pickupAt = searchParams.get("pickupAt");
    const returnAt = searchParams.get("returnAt");
    if (pickupAt && returnAt) return;
    if (!draft.pickup.datetime || !draft.return.datetime) return;
    const next = draftToSearchParams(draft);
    next.set("step", "1");
    if (selectedSlug) next.set("selected", selectedSlug);
    router.replace(`/vehicles?${next.toString()}`, { scroll: false });
  }, [draft, isStep1, ready, router, searchParams, selectedSlug]);

  const expandedVehicle: Vehicle | null = React.useMemo(() => {
    if (!selectedSlug) return null;
    return filtered.find((v) => v.slug === selectedSlug) ?? null;
  }, [filtered, selectedSlug]);

  const setQuery = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      router.replace(next.toString() ? `/vehicles?${next.toString()}` : "/vehicles", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const onCardClick = React.useCallback(
    (slug: string) => {
      setQuery((next) => next.set("selected", slug));
    },
    [setQuery],
  );

  const onClose = React.useCallback(() => {
    setQuery((next) => next.delete("selected"));
  }, [setQuery]);

  const onConfirm = React.useCallback(
    (vehicleId: string, vehicleSlug: string, choice: { type: RateType; mileage: MileagePlan }) => {
      // One synchronous sessionStorage write: merge URL search context + vehicle.
      // Avoids racing /vehicles' async draft sync when the user clicks Next quickly.
      setDraft((prev) => {
        const pickupAt = searchParams.get("pickupAt");
        const returnAt = searchParams.get("returnAt");
        const withSearch =
          pickupAt && returnAt
            ? (() => {
                const seeded = seedDraftFromSearchParams(searchParams);
                return {
                  ...prev,
                  pickup: { ...prev.pickup, ...seeded.pickup },
                  return: { ...prev.return, ...seeded.return },
                  promoCode: seeded.promoCode ?? prev.promoCode,
                };
              })()
            : prev;
        return { ...withSearch, vehicle: { vehicleId, vehicleSlug, rate: choice } };
      });
      track(EVENTS.VEHICLE_SELECTED, {
        vehicleId,
        rate: choice.type,
        mileage: choice.mileage,
      });
      const extras = new URLSearchParams({
        vehicleId,
        vehicleSlug,
        rate: choice.type,
        mileage: choice.mileage,
      });
      appendSearchContextFromParams(extras, searchParams);
      router.push(`/book/extras?${extras.toString()}`);
    },
    [router, searchParams, setDraft],
  );

  const lowestPriceActive = filters.sort === "price-asc";
  const autoOnlyActive = filters.transmission === "automatic";

  const toggleLowestPrice = () =>
    setQuery((next) => {
      if (lowestPriceActive) next.delete("sort");
      else next.set("sort", "price-asc");
    });
  const toggleAutoOnly = () =>
    setQuery((next) => {
      if (autoOnlyActive) next.delete("trans");
      else next.set("trans", "automatic");
    });
  // Multi-select category chip toggle — `category=sedan,suv` lives in the URL.
  const toggleCategory = (cat: VehicleCategory) =>
    setQuery((next) => {
      const current = (next.get("category") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
      if (updated.length) next.set("category", updated.join(","));
      else next.delete("category");
    });
  const isCategoryActive = (cat: VehicleCategory) => filters.categories.includes(cat);

  // Categories the fleet actually has — sorted by car count desc, ties broken
  // by the natural label order so the chip row stays stable across renders.
  const categoryChips = React.useMemo(
    () =>
      (Object.entries(facets.category) as Array<[VehicleCategory, number]>)
        .sort(([a, ca], [b, cb]) => cb - ca || a.localeCompare(b))
        .map(([cat]) => cat),
    [facets.category],
  );

  const pickupISO = draft?.pickup.datetime ?? "";
  const returnISO = draft?.return.datetime ?? "";

  const reduce = useMotionGate();

  return (
    <>
      {isStep1 ? <Stepper current={1} /> : null}

      {/* Sticky search summary band */}
      <section
        data-vehicles-sticky-search
        className="bg-paper border-border sticky top-0 z-20 border-b"
      >
        <div className="mx-auto max-w-[var(--container-full)] px-5 py-3 sm:px-5">
          <SearchBar branches={branches} variant="compact" />
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-full)] px-5 py-8 sm:px-5 sm:py-12">
        <h1 className="display-md text-ink-100 text-[clamp(24px,2.5vw,36px)] leading-[1.05] whitespace-nowrap">
          {t("title")}
        </h1>

        {availabilityError ? (
          <p className="bg-signal-blue/10 text-signal-blue label-md mt-4 rounded-lg px-4 py-2">
            {t("availabilityErrorBanner")}
          </p>
        ) : null}

        {/* Toolbar — every filter is a visible chip. No hidden "Filter" sheet,
         * no fuel filter, no guaranteed-model filter. Categories are
         * multi-select; clicking the same chip again clears it. */}
        <div className="mt-6 flex flex-wrap items-center gap-2 lg:mt-8">
          <Chip
            variant={lowestPriceActive ? "selected" : "default"}
            onClick={toggleLowestPrice}
            aria-pressed={lowestPriceActive}
          >
            {t("lowestPrice")}
          </Chip>
          <Chip
            variant={autoOnlyActive ? "selected" : "default"}
            onClick={toggleAutoOnly}
            aria-pressed={autoOnlyActive}
          >
            {t("autoOnly")}
          </Chip>
          {categoryChips.map((cat) => (
            <Chip
              key={cat}
              variant={isCategoryActive(cat) ? "selected" : "default"}
              onClick={() => toggleCategory(cat)}
              aria-pressed={isCategoryActive(cat)}
            >
              {tCat(cat)}
            </Chip>
          ))}
          <span className="label-md text-ink-50 ml-auto">{t("carsCount", { count: filtered.length })}</span>
        </div>

        {/* Grid — dark VehicleCards rendered in logical rows of 3. When a card
         * is selected, the expanded panel renders BELOW its row (full width)
         * instead of widening the card inline. This keeps every adjacent
         * card in its original position — clicking never reflows the grid. */}
        {filtered.length === 0 ? (
          <EmptyState
            heading={t("emptyHeading")}
            body={t("emptyBody")}
            reset={t("resetFilters")}
          />
        ) : (
          <motion.div
            variants={reduce ? undefined : staggerContainer}
            initial={reduce ? false : "hidden"}
            animate="visible"
            className="mt-6 flex flex-col gap-4 sm:gap-6 lg:mt-8"
            aria-label={t("resultsAria")}
            role="list"
          >
            {chunkRows(filtered, ROW_SIZE).map((rowVehicles, rowIdx) => {
              const selectedInRow =
                expandedVehicle && rowVehicles.some((v) => v.id === expandedVehicle.id)
                  ? expandedVehicle
                  : null;
              return (
                <React.Fragment key={`row-${rowIdx}`}>
                  <ul
                    className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
                    role="presentation"
                  >
                    {rowVehicles.map((v) => {
                      const isExpanded = expandedVehicle?.id === v.id;
                      return (
                        <motion.li
                          key={v.id}
                          variants={reduce ? undefined : staggerItem}
                          role="listitem"
                        >
                          <VehicleCard
                            vehicle={v}
                            selected={isExpanded}
                            href={`/vehicles?${withSelected(searchParams, v.slug)}`}
                            pickupISO={pickupISO}
                            returnISO={returnISO}
                            scrollOnClick={false}
                          />
                        </motion.li>
                      );
                    })}
                  </ul>

                  {/* Instant mount/unmount — no exit animation. AnimatePresence
                   * left two panels mounted during row switches, which shoved
                   * scroll to the page bottom and felt sluggish. */}
                  {selectedInRow && ready && draft ? (
                    <VehicleCardExpanded
                      key={selectedInRow.id}
                      vehicle={selectedInRow}
                      pickupISO={pickupISO}
                      returnISO={returnISO}
                      onConfirm={(choice) => onConfirm(selectedInRow.id, selectedInRow.slug, choice)}
                      onClose={onClose}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </motion.div>
        )}
      </section>
    </>
  );
}

/** Logical row size — matches the lg-viewport grid (3 columns). On smaller
 * viewports the row wraps naturally, but the expanded panel always renders
 * below the row group so adjacent cards never shift horizontally. */
const ROW_SIZE = 3;

function chunkRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function withSelected(params: URLSearchParams, slug: string): string {
  const next = new URLSearchParams(params.toString());
  next.set("selected", slug);
  return next.toString();
}

function EmptyState({ heading, body, reset }: { heading: string; body: string; reset: string }) {
  return (
    <div className="bg-paper border-border mt-8 flex flex-col items-center gap-3 rounded-xl border p-12 text-center">
      <span aria-hidden="true" className="text-5xl">
        🛣️
      </span>
      <h2 className="headline-md text-ink-95">{heading}</h2>
      <p className="body-md text-ink-60 max-w-md">{body}</p>
      <div className="mt-2 flex gap-3">
        <Button asChild variant="primary" size="sm">
          <a href="/vehicles">{reset}</a>
        </Button>
      </div>
    </div>
  );
}
