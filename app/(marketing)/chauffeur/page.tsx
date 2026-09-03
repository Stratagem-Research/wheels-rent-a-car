"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plane, MapPinned, Clock, Award, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { HowItWorksRow } from "@/components/locations/HowItWorksRow";
import { ItineraryCard } from "@/components/landing/ItineraryCard";
import { PageHero } from "@/components/marketing/PageHero";
import { PAGE_HERO_IMAGES } from "@/lib/marketing/hero-images";
import { EnquiryFormChauffeur } from "@/components/leads/EnquiryFormChauffeur";
import { useItineraries } from "@/lib/admin/useAdminStore";
import { ServiceJsonLd } from "@/components/seo/ServiceJsonLd";
import { whatsAppHref } from "@/lib/whatsapp";

/**
 * /chauffeur — INK & SIGNAL.
 *
 * Premium driver service. Inverse hero band (paper text on ink-100), 3-up
 * service categories (Airport / Day trip / Hourly), vehicle-class strip,
 * driver trust section, FAQ, enquiry form. Same rhythm as /long-term but
 * with chauffeur-specific copy and the EnquiryFormChauffeur component.
 *
 * The legacy chauffeur page existed in commit e1a94be on the wheels-1
 * branch — it's been rebuilt here against the INK & SIGNAL token set
 * (`display-*`, `headline-*`, `body-*`, `ink-100 → paper`) rather than the
 * deprecated `wheels-*` / `primary-*` palette.
 */

type ServiceType = "airport" | "day-trip" | "by-the-hour";

const SERVICE_IDS: ServiceType[] = ["airport", "day-trip", "by-the-hour"];
const CATEGORY_ICONS = [
  <Plane key="airport" className="size-5" aria-hidden="true" />,
  <MapPinned key="day-trip" className="size-5" aria-hidden="true" />,
  <Clock key="by-the-hour" className="size-5" aria-hidden="true" />,
];
const TRUST_ICONS = [
  <Award key="award" className="size-5" aria-hidden="true" />,
  <ShieldCheck key="shield" className="size-5" aria-hidden="true" />,
  <Plane key="plane" className="size-5" aria-hidden="true" />,
];

export default function ChauffeurPage() {
  const t = useTranslations("chauffeur");
  const categories = t.raw("categories") as { title: string; body: string; from: string }[];
  const vehicleClasses = t.raw("vehicleClasses") as { title: string; body: string }[];
  const trust = t.raw("trust") as { title: string; body: string }[];
  const howItWorks = t.raw("howSteps") as { title: string; body: string }[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];
  const [serviceType, setServiceType] = React.useState<ServiceType>("airport");
  const locale = useLocale();
  const itineraries = useItineraries();

  const requestService = (type: ServiceType) => {
    setServiceType(type);
    if (typeof window !== "undefined") {
      document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
        image={PAGE_HERO_IMAGES.chauffeur}
        actions={
          <>
            <Button asChild variant="primary-inverse" size="lg">
              <a href="#enquiry">{t("requestDriver")}</a>
            </Button>
            <Button asChild variant="tertiary-inverse" size="lg">
              <a href={whatsAppHref("default")} target="_blank" rel="noopener noreferrer">
                {t("chatOnWhatsapp")}
              </a>
            </Button>
          </>
        }
      />

      {/* Three service categories — paper canvas, ink cards. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("categoriesEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("categoriesHeading")}
            </h2>
            <p className="lead-md text-ink-60 mt-1">{t("categoriesSubtitle")}</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {categories.map((c, i) => {
              const serviceId = SERVICE_IDS[i] ?? "airport";
              return (
                <li key={serviceId}>
                  <Card variant="default" className="flex h-full flex-col gap-3 rounded-xl p-6">
                    <span className="bg-ink-10 text-ink-100 inline-flex size-10 items-center justify-center rounded-md">
                      {CATEGORY_ICONS[i]}
                    </span>
                    <h3 className="headline-md text-ink-100 mt-1">{c.title}</h3>
                    <p className="body-md text-ink-60">{c.body}</p>
                    <p className="label-md text-ink-50 mt-1">{c.from}</p>
                    <div className="mt-auto pt-4">
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={() => requestService(serviceId)}
                      >
                        {t("requestCta", { service: c.title })}
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Vehicle classes — tinted band. */}
      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("vehiclesEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("vehiclesHeading")}
            </h2>
            <p className="body-md text-ink-60 mt-1">{t("vehiclesSubtitle")}</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {vehicleClasses.map((v) => (
              <li key={v.title}>
                <Card variant="default" className="flex flex-col gap-2 rounded-xl p-6">
                  <h3 className="headline-sm text-ink-100">{v.title}</h3>
                  <p className="body-md text-ink-60">{v.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("howEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("howHeading")}
            </h2>
          </div>
          <HowItWorksRow steps={howItWorks} className="mt-10 lg:grid-cols-3" />
        </div>
      </section>

      {/* Sample itineraries — scroll-right carousel of our most-requested
       * chauffeur-led tours, with "See all itineraries →" routing to the
       * dedicated /itineraries listing page. Pulls from the ITINERARIES
       * Supabase CMS via useItineraries(). */}
      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end lg:mb-14">
            <div className="flex max-w-2xl flex-col gap-3">
              <p className="text-ink-60 overline">{t("itinerariesEyebrow")}</p>
              <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
                {t("itinerariesHeading")}
              </h2>
              <p className="body-md text-ink-60 mt-1">{t("itinerariesSubtitle")}</p>
            </div>
            <Link
              href="/itineraries"
              className="button-md text-ink-100 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
            >
              {t("seeAllItineraries")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:gap-6">
            {itineraries.slice(0, 6).map((itin) => (
              <li
                key={itin.slug}
                className="w-[82%] min-w-0 shrink-0 snap-start sm:w-[55%] lg:w-[32%]"
              >
                <ItineraryCard itinerary={itin} locale={locale} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* About our drivers — paper canvas. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("driversEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("driversHeading")}
            </h2>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {trust.map((item, i) => (
              <li key={item.title}>
                <Card variant="default" className="flex flex-col gap-2 rounded-xl p-6">
                  <span className="bg-ink-10 text-ink-100 inline-flex size-10 items-center justify-center rounded-md">
                    {TRUST_ICONS[i]}
                  </span>
                  <h3 className="headline-sm text-ink-100 mt-1">{item.title}</h3>
                  <p className="body-md text-ink-60">{item.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex flex-col gap-3">
            <p className="text-ink-60 overline">{t("faqEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("faqHeading")}
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Enquiry form — same INK & SIGNAL card pattern as /long-term. The
       * red `cta` submit is the singular red on the page. */}
      <section id="enquiry" className="bg-ink-10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <Card variant="default" className="flex flex-col gap-3 rounded-xl p-8">
            <h2 className="headline-lg text-ink-100">{t("formHeading")}</h2>
            <p className="body-md text-ink-60">{t("formSubtitle")}</p>
            <p className="label-md text-warning mt-1">{t("formWarning")}</p>
            <div className="mt-4">
              <EnquiryFormChauffeur initialServiceType={serviceType} />
            </div>
          </Card>
        </div>
      </section>

      {/* Bottom strip — return to fleet / WhatsApp. */}
      <section className="bg-ink-100 text-paper">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-5 py-16 text-center sm:px-10 lg:py-24">
          <h2 className="display-md text-paper text-[clamp(32px,4.5vw,56px)] leading-[1]">
            {t("bottomHeading")}
          </h2>
          <p className="lead-md text-ink-30">{t("bottomSubtitle")}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary-inverse" size="md">
              <Link href="/vehicles">{t("browseFleet")}</Link>
            </Button>
            <Button asChild variant="tertiary-inverse" size="md">
              <a href={whatsAppHref("default")} target="_blank" rel="noopener noreferrer">
                {t("chatOnWhatsapp")}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <ServiceJsonLd name={t("jsonLdName")} description={t("jsonLdDescription")} />
    </>
  );
}
