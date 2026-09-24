"use client";

import * as React from "react";
import Link from "next/link";
import { Award, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
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
import { PageHero } from "@/components/marketing/PageHero";
import { TierCardCarWash } from "@/components/marketing/TierCardCarWash";
import { PAGE_HERO_IMAGES } from "@/lib/marketing/hero-images";
import { EnquiryFormCarWash } from "@/components/leads/EnquiryFormCarWash";
import { useCarWashCatalog } from "@/hooks/useCarWashCatalog";
import { ServiceJsonLd } from "@/components/seo/ServiceJsonLd";
import { useWhatsAppHref } from "@/components/providers/ContactSettingsProvider";

const TRUST_ICONS = [
  <Award key="award" className="size-5" aria-hidden="true" />,
  <ShieldCheck key="shield" className="size-5" aria-hidden="true" />,
  <Sparkles key="sparkles" className="size-5" aria-hidden="true" />,
];

export default function CarWashPage() {
  const whatsAppHref = useWhatsAppHref();
  const t = useTranslations("carWash");
  const { packages } = useCarWashCatalog();
  const howItWorks = t.raw("howSteps") as { title: string; body: string }[];
  const trust = t.raw("trust") as { title: string; body: string }[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];
  const [packageId, setPackageId] = React.useState("normal-wash");

  const selectPackage = (id: string) => {
    setPackageId(id);
    if (typeof window !== "undefined") {
      document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
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
        image={PAGE_HERO_IMAGES.carWash}
        actions={
          <>
            <Button asChild variant="primary-inverse" size="lg">
              <a href="#enquiry">{t("bookWash")}</a>
            </Button>
            <Button asChild variant="tertiary-inverse" size="lg">
              <a href={whatsAppHref("default")} target="_blank" rel="noopener noreferrer">
                {t("chatOnWhatsapp")}
              </a>
            </Button>
          </>
        }
      />

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("packagesEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("packagesHeading")}
            </h2>
            <p className="lead-md text-ink-60 mt-1">{t("packagesSubtitle")}</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {packages.map((pkg) => (
              <li key={pkg.id} className={pkg.popular ? "order-first lg:order-none" : undefined}>
                <TierCardCarWash pkg={pkg} onSelect={selectPackage} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="mb-10 flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("howEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("howHeading")}
            </h2>
          </div>
          <HowItWorksRow steps={howItWorks} />
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("trustEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("trustHeading")}
            </h2>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {trust.map((item, i) => (
              <li key={item.title}>
                <Card variant="default" className="flex h-full flex-col gap-3 rounded-xl p-6">
                  <span className="bg-ink-10 text-ink-100 inline-flex size-10 items-center justify-center rounded-md">
                    {TRUST_ICONS[i]}
                  </span>
                  <h3 className="headline-md text-ink-100">{item.title}</h3>
                  <p className="body-md text-ink-60">{item.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">{t("faqEyebrow")}</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              {t("faqHeading")}
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-10 max-w-3xl">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section id="enquiry" className="bg-paper">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <Card variant="default" className="flex flex-col gap-3 rounded-xl p-8">
            <h2 className="headline-lg text-ink-100">{t("formHeading")}</h2>
            <p className="body-md text-ink-60">{t("formSubtitle")}</p>
            <div className="mt-4">
              <EnquiryFormCarWash
                packages={packages}
                initialPackageId={packageId}
              />
            </div>
          </Card>
          <p className="body-sm text-ink-50 mt-6 text-center">
            {t("fleetPartnershipHint")}{" "}
            <Link href="/fleet-partnership" className="text-ink-100 underline underline-offset-2">
              {t("fleetPartnershipLink")}
              <ArrowRight className="ml-1 inline size-3.5" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

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
