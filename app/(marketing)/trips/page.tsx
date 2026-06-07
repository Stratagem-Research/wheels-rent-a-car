"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { DestinationTile } from "@/components/landing/DestinationTile";
import { PageHero } from "@/components/marketing/PageHero";
import { PAGE_HERO_IMAGES } from "@/lib/marketing/hero-images";
import { useTrips } from "@/lib/admin/useAdminStore";
import type { TripRegion } from "@/types/domain";
import { getLocalizedString } from "@/lib/i18n/localized";

/*
 * /trips — self-drive trip articles listing.
 *
 * Inverse hero band + filter chips (All / Mountains / Coast / Bekaa /
 * Cultural / North / South) + 3-up tile grid. Sources from Supabase via `useTrips()`.
 *
 * Article slugs live at /trips/[slug].
 */

type RegionFilter = "all" | TripRegion;

const REGION_IDS: RegionFilter[] = [
  "all",
  "mountains",
  "coast",
  "bekaa",
  "cultural",
  "north",
  "south",
];

export default function TripsPage() {
  const trips = useTrips();
  const locale = useLocale();
  const t = useTranslations("trips");
  const [region, setRegion] = React.useState<RegionFilter>("all");

  const filtered = React.useMemo(
    () => (region === "all" ? trips : trips.filter((t) => t.region === region)),
    [region, trips],
  );

  return (
    <>
      {/* Cinematic photo-backed hero — see lib/marketing/hero-images.ts. */}
      <PageHero
        overline={t("eyebrow")}
        headline={
          <>
            {t("heroLine1")}
            <br />
            {t("heroLine2")}
          </>
        }
        lead={t("heroSubtitle")}
        image={PAGE_HERO_IMAGES.trips}
      />

      {/* Filter chips. */}
      <section className="bg-paper border-border border-b">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-6 sm:px-10">
          <ul className="flex flex-wrap items-center gap-2">
            {REGION_IDS.map((id) => {
              const active = region === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setRegion(id)}
                    className={[
                      "rounded-pill label-md h-9 px-4 transition-colors duration-150",
                      "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                      active ? "bg-ink-100 text-paper" : "bg-ink-10 text-ink-80 hover:bg-ink-20",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {t(`regions.${id}`)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Tile grid. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-12 sm:px-10 lg:py-20">
          {filtered.length === 0 ? (
            <div className="bg-ink-10 flex flex-col items-center gap-3 rounded-xl p-12 text-center">
              <h2 className="headline-md text-ink-100">{t("emptyHeading")}</h2>
              <p className="body-md text-ink-60 max-w-md">{t("emptyBody")}</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {filtered.map((trip) => (
                <li key={trip.slug}>
                  <DestinationTile
                    title={getLocalizedString(trip.title, locale)}
                    meta={getLocalizedString(trip.meta, locale)}
                    image={{
                      ...trip.coverImage,
                      alt: getLocalizedString(trip.coverImage.alt, locale),
                    }}
                    href={`/trips/${trip.slug}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
