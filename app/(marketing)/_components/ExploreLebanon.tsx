"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { DestinationTile } from "@/components/landing/DestinationTile";
import { useTrips } from "@/lib/admin/useAdminStore";

/**
 * Explore Lebanon — Revision 2 carousel rewrite.
 *
 * Horizontal snap-scroll carousel sourced from `useTrips()` (defaults
 * to the seeded TRIPS fixture, overlayed by admin CRUD writes from
 * lib/admin/store.ts). Cap to 6 trips on the homepage with a trailing
 * "View all trips →" link to /trips.
 *
 * Client component so admin writes reflect live without a page reload.
 */
export function ExploreLebanon() {
  const trips = useTrips();
  const featured = trips.slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <Reveal as="section" className="bg-paper">
      <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-32">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end lg:mb-14">
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="text-ink-60 overline">Built for the country</p>
            <h2 className="display-xl text-ink-100 text-[clamp(48px,7vw,88px)] leading-[0.96]">
              Explore Lebanon.
            </h2>
            <p className="lead-lg text-ink-60">
              Self-drive trip guides — where to go, what to see, and which car suits the route.
            </p>
          </div>
          <Link
            href="/trips"
            className="button-md text-ink-100 hover:text-ink-95 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            View all trips
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:gap-6">
          {featured.map((trip) => (
            <li
              key={trip.slug}
              className="w-[82%] min-w-0 shrink-0 snap-start sm:w-[55%] lg:w-[32%]"
            >
              <DestinationTile
                title={trip.title}
                meta={trip.meta}
                image={trip.coverImage}
                href={`/trips/${trip.slug}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
