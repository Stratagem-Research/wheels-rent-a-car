"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Building2, Check, Receipt, Users, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { HowItWorksRow } from "@/components/locations/HowItWorksRow";
import { TierCardCorporate } from "@/components/marketing/TierCardCorporate";
import { PageHero } from "@/components/marketing/PageHero";
import { PAGE_HERO_IMAGES } from "@/lib/marketing/hero-images";
import { EnquiryFormCorporate } from "@/components/leads/EnquiryFormCorporate";
import { useCorporateTiers } from "@/lib/admin/useAdminStore";
import { ServiceJsonLd } from "@/components/seo/ServiceJsonLd";
import { whatsAppHref } from "@/lib/whatsapp";
import { getLocalizedString, getLocalizedStringArray } from "@/lib/i18n/localized";

/*
 * /corporate — un-descoped in Phase 12 (Revision 2).
 *
 * Mirrors the rhythm of /long-term and /chauffeur so the three B2B service
 * pages read as a coherent set. Inverse hero band, 3 value-prop cards,
 * how-it-works row, tier comparison (Starter / Growth / Enterprise) via
 * `<TierCardCorporate />`, FAQ accordion, enquiry form.
 *
 * The lone red CTA on this page is the enquiry-form submit
 * (`Send my enquiry →`). Tier cards use primary (black) Get-a-quote
 * buttons so the singular-red rule holds.
 */

type TierId = string;

const VALUE_PROP_ICONS = [
  <Building2 key="fleet" className="size-5" aria-hidden="true" />,
  <Receipt key="invoice" className="size-5" aria-hidden="true" />,
  <Users key="manager" className="size-5" aria-hidden="true" />,
  <Wrench key="maintenance" className="size-5" aria-hidden="true" />,
];

export default function CorporatePage() {
  const t = useTranslations("corporate");
  const valueProps = t.raw("valueProps") as { title: string; body: string }[];
  const howItWorks = t.raw("howSteps") as { title: string; body: string }[];
  const inclusions = t.raw("inclusions") as string[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];
  const tiers = useCorporateTiers();
  const locale = useLocale();
  const [selectedTier, setSelectedTier] = React.useState<TierId>("co-growth");

  const onTierSelect = (id: TierId) => {
    setSelectedTier(id);
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
        image={PAGE_HERO_IMAGES.corporate}
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

      {/* Value props — paper canvas. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("valuePropsEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("valuePropsHeading")}
            </h2>
            <p className="lead-md text-ink-60 mt-1">{t("valuePropsSubtitle")}</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {valueProps.map((v, i) => (
              <li key={v.title}>
                <Card variant="default" className="flex h-full flex-col gap-3 rounded-xl p-6">
                  <span className="bg-ink-10 text-ink-100 inline-flex size-10 items-center justify-center rounded-md">
                    {VALUE_PROP_ICONS[i]}
                  </span>
                  <h3 className="headline-sm text-ink-100 mt-1">{v.title}</h3>
                  <p className="body-md text-ink-60">{v.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tier comparison — same surface treatment as /long-term. */}
      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("tiersEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("tiersHeading")}
            </h2>
            <p className="lead-md text-ink-60 mt-1">{t("tiersSubtitle")}</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {tiers.map((tier) => (
              <li key={tier.id} className={tier.popular ? "order-first lg:order-none" : undefined}>
                <TierCardCorporate
                  tier={{
                    ...tier,
                    name: getLocalizedString(tier.name, locale),
                    tagline: getLocalizedString(tier.tagline, locale),
                    fleetSize: getLocalizedString(tier.fleetSize, locale),
                    inclusions: getLocalizedStringArray(tier.inclusions, locale),
                    ctaLabel: tier.ctaLabel ? getLocalizedString(tier.ctaLabel, locale) : undefined,
                  }}
                  onSelect={onTierSelect}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works. */}
      <section id="how-it-works" className="bg-paper">
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

      {/* Trust strip — bullet-list of what's included. */}
      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("includedEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("includedHeading")}
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

      {/* FAQ accordion. */}
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

      {/* Enquiry form — singular red `cta` submit. */}
      <section id="enquiry" className="bg-ink-10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <Card variant="default" className="flex flex-col gap-3 rounded-xl p-8">
            <h2 className="headline-lg text-ink-100">{t("formHeading")}</h2>
            <p className="body-md text-ink-60">{t("formSubtitle")}</p>
            <div className="mt-4">
              <EnquiryFormCorporate initialTier={selectedTier} />
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
