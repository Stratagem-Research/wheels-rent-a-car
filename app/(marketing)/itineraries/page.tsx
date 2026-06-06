"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ItineraryCard } from "@/components/landing/ItineraryCard";
import { useItineraries } from "@/lib/admin/useAdminStore";
import type { ItineraryCategory } from "@/types/domain";

/*
 * /itineraries — chauffeur-led itineraries listing.
 *
 * Inverse hero band + filter chips + 3-up tile grid. Lone red CTA on the
 * page is "Request a driver" routing back to /chauffeur#enquiry — the
 * itineraries themselves are catalog content; conversion happens through
 * the chauffeur enquiry form.
 *
 * Sources from Supabase via `useItineraries()` → `/api/cms/itineraries`.
 */

type CategoryFilter = "all" | ItineraryCategory;

const CATEGORY_OPTIONS: Array<{ id: CategoryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "day-trip", label: "Day trips" },
  { id: "multi-day", label: "Multi-day" },
  { id: "cultural", label: "Cultural" },
  { id: "wine", label: "Wine" },
  { id: "north", label: "North" },
  { id: "south", label: "South" },
];

export default function ItinerariesPage() {
  const itineraries = useItineraries();
  const [category, setCategory] = React.useState<CategoryFilter>("all");

  const filtered = React.useMemo(
    () => (category === "all" ? itineraries : itineraries.filter((i) => i.category === category)),
    [category, itineraries],
  );

  return (
    <>
      {/* Inverse hero band — matches /long-term + /chauffeur + /corporate. */}
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">Chauffeur-led</p>
          <h1 className="display-xl text-paper mt-3 text-[clamp(48px,7vw,88px)] leading-[0.96]">
            Chauffeur-led
            <br />
            itineraries.
          </h1>
          <p className="lead-lg text-ink-30 mt-5 max-w-2xl">
            Curated day trips and multi-day tours, driven by our team. Tell us the one you want,
            we&apos;ll handle everything else.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="cta" size="lg">
              <Link href="/chauffeur#enquiry">Request a driver</Link>
            </Button>
            <Button asChild variant="tertiary-inverse" size="lg">
              <Link href="/chauffeur">About our chauffeurs</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Filter chips. */}
      <section className="bg-paper border-border border-b">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-6 sm:px-10">
          <ul className="flex flex-wrap items-center gap-2">
            {CATEGORY_OPTIONS.map((opt) => {
              const active = category === opt.id;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => setCategory(opt.id)}
                    className={[
                      "rounded-pill label-md h-9 px-4 transition-colors duration-150",
                      "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                      active ? "bg-ink-100 text-paper" : "bg-ink-10 text-ink-80 hover:bg-ink-20",
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
              <h2 className="headline-md text-ink-100">No itineraries in this category yet.</h2>
              <p className="body-md text-ink-60 max-w-md">
                Tell us what you have in mind on WhatsApp and we&apos;ll build something custom.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {filtered.map((itin) => (
                <li key={itin.slug}>
                  <ItineraryCard itinerary={itin} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
