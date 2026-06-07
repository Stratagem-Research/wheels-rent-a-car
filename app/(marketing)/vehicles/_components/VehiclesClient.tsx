"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import { useMotionGate } from "@/lib/motion/useMotionGate";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SearchBar } from "@/components/search/SearchBar";
import { Stepper } from "@/components/booking/Stepper";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { VehicleCardExpanded } from "@/components/vehicle/VehicleCardExpanded";
import { BRANCHES } from "@/lib/api/mocks/fixtures/branches";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import {
  applyFilters,
  computeFacets,
  parseFiltersFromSearch,
  sortFiltered,
} from "@/lib/vehicles/filter";
import { useBookingDraft } from "@/hooks/useBookingDraft";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import type { MileagePlan, RateType, Vehicle, VehicleCategory } from "@/types/domain";

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

export function VehiclesClient() {
  const t = useTranslations("vehicles");
  const tCat = useTranslations("vehicleCategories");
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const searchParams = React.useMemo(
    () => new URLSearchParams(searchParamsHook?.toString() ?? ""),
    [searchParamsHook],
  );

  const filters = parseFiltersFromSearch(searchParams);
  const facets = React.useMemo(() => computeFacets(VEHICLES), []);
  const filtered = React.useMemo(
    () => sortFiltered(applyFilters(VEHICLES, filters), filters.sort),
    [filters],
  );

  const isStep1 = searchParams.get("step") === "1";
  const selectedSlug = searchParams.get("selected");

  const { ready, draft, setVehicle } = useBookingDraft();

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
    (vehicleId: string, choice: { type: RateType; mileage: MileagePlan }) => {
      setVehicle(vehicleId, choice);
      track(EVENTS.VEHICLE_SELECTED, {
        vehicleId,
        rate: choice.type,
        mileage: choice.mileage,
      });
      router.push("/book/extras");
    },
    [router, setVehicle],
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
      <section className="bg-paper border-border sticky top-0 z-20 border-b">
        <div className="mx-auto max-w-[var(--container-full)] px-5 py-3 sm:px-5">
          <SearchBar branches={BRANCHES} variant="compact" />
        </div>
      </section>

      <section className="mx-auto max-w-[var(--container-full)] px-5 py-8 sm:px-5 sm:py-12">
        <h1 className="display-md text-ink-100 text-[clamp(24px,2.5vw,36px)] leading-[1.05] whitespace-nowrap">
          {t("title")}
        </h1>

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
          <LayoutGroup>
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
                            layout
                            variants={reduce ? undefined : staggerItem}
                            transition={reduce ? { duration: 0 } : undefined}
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

                    <AnimatePresence initial={false}>
                      {selectedInRow && ready && draft ? (
                        <motion.div
                          key={`expanded-${selectedInRow.id}`}
                          layout
                          initial={reduce ? false : { opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
                          transition={{ duration: reduce ? 0 : 0.22 }}
                        >
                          <VehicleCardExpanded
                            vehicle={selectedInRow}
                            pickupISO={pickupISO}
                            returnISO={returnISO}
                            onConfirm={(choice) => onConfirm(selectedInRow.id, choice)}
                            onClose={onClose}
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </motion.div>
          </LayoutGroup>
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
