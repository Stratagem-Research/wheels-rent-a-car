"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Car } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DestinationTile } from "@/components/landing/DestinationTile";
import { useTrips } from "@/lib/admin/useAdminStore";
import { CATEGORY_LABELS } from "@/lib/vehicles/labels";

/*
 * /trips/[slug] — self-drive trip article.
 *
 * Client component so admin-created/edited trips reflect live. Hero
 * cover photo + title + meta, body in body-lg narrow column,
 * suggested-vehicle card (lone red CTA on the page), related trips at
 * the bottom.
 *
 * Sourced from `useTrips()` (lib/admin/store.ts → localStorage with
 * fixture fallback). When the real backend lands, swap the hook for
 * an authenticated fetch().
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TripDetailPage({ params }: PageProps) {
  const { slug } = React.use(params);
  const trips = useTrips();
  const trip = trips.find((t) => t.slug === slug);

  // Update document title client-side so the tab reflects the article.
  React.useEffect(() => {
    if (trip) document.title = `${trip.title} — Wheels Rent A Car`;
  }, [trip]);

  if (!trip) notFound();

  const related = trips.filter((t) => t.slug !== trip.slug).slice(0, 3);

  return (
    <>
      {/* Hero cover. */}
      <header className="bg-ink-95 relative isolate overflow-hidden">
        <Image
          src={trip.coverImage.src}
          alt={trip.coverImage.alt}
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.45)_55%,rgba(0,0,0,0.75)_100%)]"
        />
        <div className="mx-auto max-w-[var(--container-default)] px-5 pt-24 pb-12 sm:px-10 sm:pt-28 sm:pb-16 lg:pt-36 lg:pb-24">
          <p className="text-paper/70 overline">{trip.meta}</p>
          <h1 className="display-xl text-paper mt-3 max-w-3xl text-[clamp(40px,6vw,76px)] leading-[0.98]">
            {trip.title}
          </h1>
          <p className="lead-lg text-paper/85 mt-5 max-w-2xl">{trip.excerpt}</p>
        </div>
      </header>

      {/* Body + sidebar. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
            <article className="body-lg text-ink-90 max-w-[680px]">
              {trip.body.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mt-6 first:mt-0">
                  {paragraph}
                </p>
              ))}

              {trip.tags.length > 0 ? (
                <div className="mt-12 flex flex-wrap gap-2">
                  {trip.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-ink-10 text-ink-80 label-md rounded-pill inline-flex items-center gap-1 px-3 py-1 capitalize"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-ink-10 flex flex-col gap-3 rounded-xl p-6">
                <p className="text-ink-60 overline">Recommended for this drive</p>
                <h2 className="headline-md text-ink-100 flex items-center gap-2">
                  <Car className="size-5" aria-hidden="true" />
                  {CATEGORY_LABELS[trip.suggestedVehicleCategory]}
                </h2>
                <p className="body-sm text-ink-60">
                  Based on the road conditions and terrain — pick any car in the{" "}
                  {CATEGORY_LABELS[trip.suggestedVehicleCategory].toLowerCase()} category to drive
                  this route comfortably.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <Button asChild variant="cta" size="md">
                    <Link href={`/vehicles?category=${trip.suggestedVehicleCategory}`}>
                      Browse {CATEGORY_LABELS[trip.suggestedVehicleCategory].toLowerCase()} cars
                    </Link>
                  </Button>
                  <Button asChild variant="tertiary" size="md">
                    <Link href="/chauffeur">Take a chauffeur instead</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related trips. */}
      {related.length > 0 ? (
        <section className="bg-ink-10">
          <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
            <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end lg:mb-14">
              <div className="flex flex-col gap-3">
                <p className="text-ink-60 overline">Keep exploring</p>
                <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
                  More Lebanon drives.
                </h2>
              </div>
              <Link
                href="/trips"
                className="button-md text-ink-100 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                All trips
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {related.map((t) => (
                <li key={t.slug}>
                  <DestinationTile
                    title={t.title}
                    meta={t.meta}
                    image={t.coverImage}
                    href={`/trips/${t.slug}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
