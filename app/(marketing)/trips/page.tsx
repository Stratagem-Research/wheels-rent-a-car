"use client";

import * as React from "react";
import { DestinationTile } from "@/components/landing/DestinationTile";
import { useTrips } from "@/lib/admin/useAdminStore";
import type { TripRegion } from "@/types/domain";

/*
 * /trips — self-drive trip articles listing.
 *
 * Inverse hero band + filter chips (All / Mountains / Coast / Bekaa /
 * Cultural / North / South) + 3-up tile grid. Sources from Supabase via `useTrips()`.
 *
 * Article slugs live at /trips/[slug].
 */

type RegionFilter = "all" | TripRegion;

const REGION_OPTIONS: Array<{ id: RegionFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "mountains", label: "Mountains" },
  { id: "coast", label: "Coast" },
  { id: "bekaa", label: "Bekaa" },
  { id: "cultural", label: "Cultural" },
  { id: "north", label: "North" },
  { id: "south", label: "South" },
];

export default function TripsPage() {
  const trips = useTrips();
  const [region, setRegion] = React.useState<RegionFilter>("all");

  const filtered = React.useMemo(
    () => (region === "all" ? trips : trips.filter((t) => t.region === region)),
    [region, trips],
  );

  return (
    <>
      {/* Inverse hero band — matches /long-term + /chauffeur + /corporate. */}
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">Self-drive</p>
          <h1 className="display-xl text-paper mt-3 text-[clamp(48px,7vw,88px)] leading-[0.96]">
            Plan your
            <br />
            Lebanon drive.
          </h1>
          <p className="lead-lg text-ink-30 mt-5 max-w-2xl">
            Day-trip guides written from real Lebanese routes. Each one tells you what to expect,
            how long it takes, and which car suits the road.
          </p>
        </div>
      </header>

      {/* Filter chips. */}
      <section className="bg-paper border-border border-b">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-6 sm:px-10">
          <ul className="flex flex-wrap items-center gap-2">
            {REGION_OPTIONS.map((opt) => {
              const active = region === opt.id;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => setRegion(opt.id)}
                    className={[
                      "rounded-pill label-md h-9 px-4 transition-colors duration-150",
                      "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                      active
                        ? "bg-ink-100 text-paper"
                        : "bg-ink-10 text-ink-80 hover:bg-ink-20",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {opt.label}
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
              <h2 className="headline-md text-ink-100">No trips in this region yet.</h2>
              <p className="body-md text-ink-60 max-w-md">
                We&apos;re writing more guides every month. Try a different region or check back
                later.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {filtered.map((trip) => (
                <li key={trip.slug}>
                  <DestinationTile
                    title={trip.title}
                    meta={trip.meta}
                    image={trip.coverImage}
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
