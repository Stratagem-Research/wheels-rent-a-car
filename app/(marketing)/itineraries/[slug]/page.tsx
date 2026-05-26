"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ItineraryCard } from "@/components/landing/ItineraryCard";
import { useItineraries } from "@/lib/admin/useAdminStore";
import { formatUsd } from "@/lib/booking/pricing";

/*
 * /itineraries/[slug] — chauffeur itinerary detail.
 *
 * Client component for the same reason as /trips/[slug] — admin writes
 * are localStorage-backed, so the detail page must read from the same
 * hook the listing uses. Lone red CTA is "Request this itinerary".
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

const VEHICLE_CLASS_LABELS: Record<string, string> = {
  sedan: "Sedan",
  suv: "SUV",
  van: "Van",
};

const VEHICLE_CLASS_BLURBS: Record<string, string> = {
  sedan: "Mercedes E-Class or similar — executive comfort for 2-3 passengers.",
  suv: "Mercedes GLE or similar — 4-5 passengers with a generous boot.",
  van: "Mercedes V-Class or similar — up to 7 passengers, family-ready.",
};

export default function ItineraryDetailPage({ params }: PageProps) {
  const { slug } = React.use(params);
  const itineraries = useItineraries();
  const itin = itineraries.find((i) => i.slug === slug);

  React.useEffect(() => {
    if (itin) document.title = `${itin.title} — Chauffeur itinerary — Wheels Rent A Car`;
  }, [itin]);

  if (!itin) notFound();

  const related = itineraries.filter((i) => i.slug !== itin.slug).slice(0, 3);

  return (
    <>
      <header className="bg-ink-95 relative isolate overflow-hidden">
        <Image
          src={itin.coverImage.src}
          alt={itin.coverImage.alt}
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
          <p className="text-paper/70 overline">Chauffeur-led · {itin.duration}</p>
          <h1 className="display-xl text-paper mt-3 max-w-3xl text-[clamp(40px,6vw,76px)] leading-[0.98]">
            {itin.title}
          </h1>
          <p className="lead-lg text-paper/85 mt-5 max-w-2xl">{itin.excerpt}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="rounded-pill bg-paper/15 text-paper label-md inline-flex items-center gap-1.5 px-3 py-1.5">
              <Clock className="size-4" aria-hidden="true" /> {itin.duration}
            </span>
            <span className="rounded-pill bg-paper/15 text-paper label-md inline-flex items-center gap-1.5 px-3 py-1.5">
              From {formatUsd(itin.priceFromCents)}
            </span>
            <span className="rounded-pill bg-paper/15 text-paper label-md inline-flex items-center gap-1.5 px-3 py-1.5 capitalize">
              {VEHICLE_CLASS_LABELS[itin.vehicleClass]}
            </span>
          </div>
        </div>
      </header>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="text-ink-60 overline">Highlights</p>
              <h2 className="display-md text-ink-100 mt-3 text-[clamp(32px,4.5vw,56px)] leading-[1]">
                What you&apos;ll see.
              </h2>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {itin.highlights.map((h) => (
                  <li key={h} className="body-md text-ink-80 flex items-start gap-2">
                    <Check
                      className="text-ink-100 mt-0.5 size-4 shrink-0"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-ink-10 flex flex-col gap-3 rounded-xl p-6">
                <p className="text-ink-60 overline">Vehicle class</p>
                <h3 className="headline-md text-ink-100 capitalize">
                  {VEHICLE_CLASS_LABELS[itin.vehicleClass]}
                </h3>
                <p className="body-sm text-ink-60">{VEHICLE_CLASS_BLURBS[itin.vehicleClass]}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <Button asChild variant="cta" size="md">
                    <Link href="/chauffeur#enquiry">Request this itinerary</Link>
                  </Button>
                  <Button asChild variant="tertiary" size="md">
                    <Link href="/chauffeur">Other chauffeur formats</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-60 overline">Sample schedule</p>
          <h2 className="display-md text-ink-100 mt-3 text-[clamp(32px,4.5vw,56px)] leading-[1]">
            How the day flows.
          </h2>
          <ol className="mt-10 flex flex-col gap-6">
            {itin.schedule.map((step, i) => (
              <li key={`${step.time}-${i}`} className="flex gap-4 sm:gap-6">
                <span className="price-md text-ink-100 tabular-nums w-16 shrink-0">
                  {step.time}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <h3 className="headline-sm text-ink-100">{step.title}</h3>
                  {step.body ? <p className="body-md text-ink-60">{step.body}</p> : null}
                </div>
              </li>
            ))}
          </ol>
          <p className="body-sm text-ink-50 mt-8">
            Final schedule confirmed with your driver after enquiry — every itinerary is tailored
            to your group and pace.
          </p>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="bg-paper">
          <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
            <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end lg:mb-14">
              <div className="flex flex-col gap-3">
                <p className="text-ink-60 overline">More routes</p>
                <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
                  Other itineraries.
                </h2>
              </div>
              <Link
                href="/itineraries"
                className="button-md text-ink-100 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                See all
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {related.map((i) => (
                <li key={i.slug}>
                  <ItineraryCard itinerary={i} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
