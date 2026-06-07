"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ItineraryCard } from "@/components/landing/ItineraryCard";
import { PageHero } from "@/components/marketing/PageHero";
import { PAGE_HERO_IMAGES } from "@/lib/marketing/hero-images";
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

const CATEGORY_IDS: CategoryFilter[] = [
  "all",
  "day-trip",
  "multi-day",
  "cultural",
  "wine",
  "north",
  "south",
];

export default function ItinerariesPage() {
  const itineraries = useItineraries();
  const locale = useLocale();
  const t = useTranslations("itineraries");
  const [category, setCategory] = React.useState<CategoryFilter>("all");

  const filtered = React.useMemo(
    () => (category === "all" ? itineraries : itineraries.filter((i) => i.category === category)),
    [category, itineraries],
  );

  return (
    <>
      {/* Cinematic photo-backed hero — see lib/marketing/hero-images.ts.
       * The lone red CTA ("Request a driver") stays as the page's singular red. */}
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
        image={PAGE_HERO_IMAGES.itineraries}
        actions={
          <>
            <Button asChild variant="cta" size="lg">
              <Link href="/chauffeur#enquiry">{t("requestDriver")}</Link>
            </Button>
            <Button asChild variant="tertiary-inverse" size="lg">
              <Link href="/chauffeur">{t("aboutChauffeurs")}</Link>
            </Button>
          </>
        }
      />

      {/* Filter chips. */}
      <section className="bg-paper border-border border-b">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-6 sm:px-10">
          <ul className="flex flex-wrap items-center gap-2">
            {CATEGORY_IDS.map((id) => {
              const active = category === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setCategory(id)}
                    className={[
                      "rounded-pill label-md h-9 px-4 transition-colors duration-150",
                      "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                      active ? "bg-ink-100 text-paper" : "bg-ink-10 text-ink-80 hover:bg-ink-20",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {t(`categories.${id}`)}
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
              {filtered.map((itin) => (
                <li key={itin.slug}>
                  <ItineraryCard itinerary={itin} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
