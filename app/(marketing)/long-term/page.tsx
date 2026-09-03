"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { HowItWorksRow } from "@/components/locations/HowItWorksRow";
import { TierCardLongTerm } from "@/components/marketing/TierCardLongTerm";
import { PageHero } from "@/components/marketing/PageHero";
import { PAGE_HERO_IMAGES } from "@/lib/marketing/hero-images";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { EnquiryFormLongTerm } from "@/components/leads/EnquiryFormLongTerm";
import { ServiceJsonLd } from "@/components/seo/ServiceJsonLd";
import { useLongTermCatalog } from "@/hooks/useLongTermCatalog";
import { whatsAppHref } from "@/lib/whatsapp";

export default function LongTermPage() {
  const t = useTranslations("longTerm");
  const { tiers: LONG_TERM_TIERS, vehicles: popularVehicles } = useLongTermCatalog();
  const howItWorks = t.raw("howSteps") as { title: string; body: string }[];
  const inclusions = t.raw("inclusions") as string[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];
  const [duration, setDuration] = React.useState<"1" | "3" | "6" | "12">("6");

  const scrollToForm = (months: 1 | 3 | 6 | 12) => {
    setDuration(String(months) as "1" | "3" | "6" | "12");
    if (typeof window !== "undefined") {
      document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Cinematic photo-backed hero — see lib/marketing/hero-images.ts.
       * White-pill CTAs here; red stays reserved for the enquiry form below. */}
      <PageHero
        overline={t("heroEyebrow")}
        headline={
          <>
            {t("heroLine1")}
            <br />
            {t("heroLine2")}
          </>
        }
        lead={t("heroSubtitle")}
        image={PAGE_HERO_IMAGES.longTerm}
        actions={
          <>
            <Button asChild variant="primary-inverse" size="lg">
              <a href="#enquiry">{t("getQuote")}</a>
            </Button>
            <Button asChild variant="tertiary-inverse" size="lg">
              <a href="#how-it-works">{t("howItWorksLink")}</a>
            </Button>
          </>
        }
      />

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("tiersEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("tiersHeading")}
            </h2>
            <p className="lead-md text-ink-60 mt-1">{t("tiersSubtitle")}</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {LONG_TERM_TIERS.map((tier) => (
              <li key={tier.id} className={tier.popular ? "order-first lg:order-none" : undefined}>
                <TierCardLongTerm tier={tier} onSelect={scrollToForm} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="bg-ink-10">
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

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("whatEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("whatHeading")}
            </h2>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {inclusions.map((line) => (
              <li key={line} className="body-md text-ink-80 flex items-start gap-2">
                <Check className="text-ink-100 mt-1 size-4 shrink-0" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Long-term "Cars our clients love" — promoted to a Featured4-style
       * dark band with the default (gradient) VehicleCard surface, so the
       * service page reads as a sibling of the landing page's fleet feature. */}
      <section className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-40 overline">{t("favouritesEyebrow")}</p>
            <h2 className="display-md text-paper text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("favouritesHeading")}
            </h2>
          </div>
          <ul className="mt-10 grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 sm:gap-6 lg:auto-cols-[minmax(0,1fr)] lg:grid-flow-row lg:grid-cols-3">
            {popularVehicles
              .slice(0, 6)
              .map((v) => (
                <li key={v.id}>
                  <VehicleCard vehicle={v} />
                </li>
              ))}
          </ul>
        </div>
      </section>

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

      <section id="enquiry" className="bg-ink-10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <Card variant="default" className="flex flex-col gap-3 rounded-xl p-8">
            <h2 className="headline-lg text-ink-100">{t("formHeading")}</h2>
            <p className="body-md text-ink-60">{t("formSubtitle")}</p>
            <div className="mt-4">
              <EnquiryFormLongTerm initialDuration={duration} />
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-ink-100 text-paper">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-5 py-16 text-center sm:px-10 lg:py-24">
          <h2 className="display-md text-paper text-[clamp(32px,4.5vw,56px)] leading-[1]">
            {t("soonerHeading")}
          </h2>
          <p className="lead-md text-ink-30">{t("soonerSubtitle")}</p>
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
