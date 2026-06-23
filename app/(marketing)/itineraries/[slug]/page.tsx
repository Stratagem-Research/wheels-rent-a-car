"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ItineraryCard } from "@/components/landing/ItineraryCard";
import { useItineraries } from "@/lib/admin/useAdminStore";
import { formatUsd } from "@/lib/booking/pricing";
import { getLocalizedString, getLocalizedStringArray } from "@/lib/i18n/localized";

/*
 * /itineraries/[slug], chauffeur itinerary detail.
 *
 * Client component for the same reason as /trips/[slug], admin writes
 * load from Supabase via `useItineraries()`, so the detail page reads the same
 * hook the listing uses. Lone red CTA is "Request this itinerary".
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ItineraryDetailPage({ params }: PageProps) {
  const { slug } = React.use(params);
  const itineraries = useItineraries();
  const locale = useLocale();
  const t = useTranslations("itineraries");
  const itin = itineraries.find((i) => i.slug === slug);

  React.useEffect(() => {
    if (itin) {
      document.title = `${getLocalizedString(itin.title, locale)} · Chauffeur itinerary · Wheels Rent A Car`;
    }
  }, [itin, locale]);

  if (!itin) notFound();

  const related = itineraries.filter((i) => i.slug !== itin.slug).slice(0, 3);
  const vehicleClassLabel = t(`vehicleClassLabels.${itin.vehicleClass}`);
  const vehicleClassBlurb = t(`vehicleClassBlurbs.${itin.vehicleClass}`);

  return (
    <>
      <header className="bg-ink-95 relative isolate overflow-hidden">
        <Image
          src={itin.coverImage.src}
          alt={getLocalizedString(itin.coverImage.alt, locale)}
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
          <p className="text-paper/70 overline">
            {t("chauffeurLed")} · {getLocalizedString(itin.duration, locale)}
          </p>
          <h1 className="display-xl text-paper mt-3 max-w-3xl text-[clamp(40px,6vw,76px)] leading-[0.98]">
            {getLocalizedString(itin.title, locale)}
          </h1>
          <p className="lead-lg text-paper/85 mt-5 max-w-2xl">
            {getLocalizedString(itin.excerpt, locale)}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="rounded-pill bg-paper/15 text-paper label-md inline-flex items-center gap-1.5 px-3 py-1.5">
              <Clock className="size-4" aria-hidden="true" />{" "}
              {getLocalizedString(itin.duration, locale)}
            </span>
            <span className="rounded-pill bg-paper/15 text-paper label-md inline-flex items-center gap-1.5 px-3 py-1.5">
              {t("from")} {formatUsd(itin.priceFromCents)}
            </span>
            <span className="rounded-pill bg-paper/15 text-paper label-md inline-flex items-center gap-1.5 px-3 py-1.5">
              {vehicleClassLabel}
            </span>
          </div>
        </div>
      </header>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="text-ink-60 overline">{t("highlightsEyebrow")}</p>
              <h2 className="display-md text-ink-100 mt-3 text-[clamp(32px,4.5vw,56px)] leading-[1]">
                {t("whatYoullSee")}
              </h2>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {getLocalizedStringArray(itin.highlights, locale).map((h) => (
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
                <p className="text-ink-60 overline">{t("vehicleClassEyebrow")}</p>
                <h3 className="headline-md text-ink-100">{vehicleClassLabel}</h3>
                <p className="body-sm text-ink-60">{vehicleClassBlurb}</p>
                <div className="mt-3 flex flex-col gap-2">
                  <Button asChild variant="cta" size="md">
                    <Link href="/chauffeur#enquiry">{t("requestThis")}</Link>
                  </Button>
                  <Button asChild variant="tertiary" size="md">
                    <Link href="/chauffeur">{t("otherFormats")}</Link>
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-60 overline">{t("scheduleEyebrow")}</p>
          <h2 className="display-md text-ink-100 mt-3 text-[clamp(32px,4.5vw,56px)] leading-[1]">
            {t("howDayFlows")}
          </h2>
          <ol className="mt-10 flex flex-col gap-6">
            {itin.schedule.map((step, i) => (
              <li key={`${step.time}-${i}`} className="flex gap-4 sm:gap-6">
                <span className="price-md text-ink-100 w-16 shrink-0 tabular-nums">
                  {step.time}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <h3 className="headline-sm text-ink-100">
                    {getLocalizedString(step.title, locale)}
                  </h3>
                  {step.body ? (
                    <p className="body-md text-ink-60">{getLocalizedString(step.body, locale)}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
          <p className="body-sm text-ink-50 mt-8">{t("scheduleNote")}</p>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="bg-paper">
          <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
            <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end lg:mb-14">
              <div className="flex flex-col gap-3">
                <p className="text-ink-60 overline">{t("moreRoutesEyebrow")}</p>
                <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
                  {t("otherItineraries")}
                </h2>
              </div>
              <Link
                href="/itineraries"
                className="button-md text-ink-100 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                {t("seeAll")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {related.map((i) => (
                <li key={i.slug}>
                  <ItineraryCard itinerary={i} locale={locale} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
