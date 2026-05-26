"use client";

import * as React from "react";
import Link from "next/link";
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
import { EnquiryFormCorporate } from "@/components/leads/EnquiryFormCorporate";
import { useCorporateTiers } from "@/lib/admin/useAdminStore";
import { whatsAppHref } from "@/lib/whatsapp";

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

const VALUE_PROPS = [
  {
    icon: <Building2 className="size-5" aria-hidden="true" />,
    title: "Dedicated fleet",
    body: "Reserved cars sized to your monthly demand. No more last-minute scrambles.",
  },
  {
    icon: <Receipt className="size-5" aria-hidden="true" />,
    title: "Single monthly invoice",
    body: "VAT-ready statements consolidated by employee, project, or cost centre.",
  },
  {
    icon: <Users className="size-5" aria-hidden="true" />,
    title: "Account manager",
    body: "One named contact on WhatsApp + email. Same person every time you book.",
  },
  {
    icon: <Wrench className="size-5" aria-hidden="true" />,
    title: "Maintenance handled",
    body: "Service, swaps, and replacement vehicles included. Zero downtime for your team.",
  },
];

const HOW_IT_WORKS = [
  { title: "Tell us your needs", body: "Fleet size, vehicle classes, contract length. 60 seconds." },
  { title: "We send a custom quote", body: "Within one business day. Includes terms and an SLA." },
  { title: "Onboard & drive", body: "Account set up in 48h. Book through portal or WhatsApp." },
];

const FAQS = [
  {
    id: "minimum",
    q: "Is there a minimum contract?",
    a: "Starter requires no contract — month-to-month billing. Growth typically runs on a 6-month agreement. Enterprise terms are custom.",
  },
  {
    id: "billing",
    q: "How does billing work?",
    a: "A single monthly invoice consolidated by employee, project, or cost centre. Payment by bank transfer (Lebanese or international) or card. Net-15 by default; Net-30 for Enterprise.",
  },
  {
    id: "drivers",
    q: "Who can drive our corporate vehicles?",
    a: "Any of your employees with a valid licence and our standard age requirement (25+). Driver documents stored once in your portal and re-used across bookings.",
  },
  {
    id: "swap",
    q: "Can we change vehicle classes mid-contract?",
    a: "Yes. Growth and Enterprise tiers include free swaps once per quarter; same-category swaps are immediate, class upgrades adjust the daily rate proportionally.",
  },
  {
    id: "delivery",
    q: "Do you deliver to our office?",
    a: "Free delivery anywhere in Greater Beirut for Growth and Enterprise. Starter delivery is at standard zone-based rates.",
  },
  {
    id: "international",
    q: "Can our visiting executives use the account?",
    a: "Yes. International licences in Latin script are accepted; for non-Latin licences, an International Driving Permit is required. We can pre-authorise drivers ahead of arrival.",
  },
];

export default function CorporatePage() {
  const tiers = useCorporateTiers();
  const [selectedTier, setSelectedTier] = React.useState<TierId>("co-growth");

  const onTierSelect = (id: TierId) => {
    setSelectedTier(id);
    if (typeof window !== "undefined") {
      document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Inverse hero band — paper text on ink-100. Same rhythm as
       * /long-term + /chauffeur so the three service pages pair. */}
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">For business</p>
          <h1 className="display-xl text-paper mt-3 text-[clamp(48px,7vw,88px)] leading-[0.96]">
            Drive your
            <br />
            business.
          </h1>
          <p className="lead-lg text-ink-30 mt-5 max-w-2xl">
            Corporate car rental built for Lebanese companies and visiting executives. Volume
            pricing, dedicated account management, one clean invoice.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="primary-inverse" size="lg">
              <a href="#enquiry">Get a quote</a>
            </Button>
            <Button asChild variant="tertiary-inverse" size="lg">
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Value props — paper canvas. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">Why corporate</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              The fleet, on terms that suit you.
            </h2>
            <p className="lead-md text-ink-60 mt-1">
              Built for teams that need cars regularly, with the predictability of a corporate
              agreement.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {VALUE_PROPS.map((v) => (
              <li key={v.title}>
                <Card variant="default" className="flex h-full flex-col gap-3 rounded-xl p-6">
                  <span className="bg-ink-10 text-ink-100 inline-flex size-10 items-center justify-center rounded-md">
                    {v.icon}
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
            <p className="text-ink-60 overline">Tiers</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              Three sizes. One way to drive.
            </h2>
            <p className="lead-md text-ink-60 mt-1">
              Pick the tier that matches your usage. Move up at any point as your team grows.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {tiers.map((tier) => (
              <li key={tier.id} className={tier.popular ? "order-first lg:order-none" : undefined}>
                <TierCardCorporate tier={tier} onSelect={onTierSelect} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works. */}
      <section id="how-it-works" className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">Getting started</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              How it works.
            </h2>
          </div>
          <HowItWorksRow steps={HOW_IT_WORKS} className="mt-10 lg:grid-cols-3" />
        </div>
      </section>

      {/* Trust strip — bullet-list of what's included. */}
      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">What&apos;s included</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              Built around how teams actually work.
            </h2>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Comprehensive insurance",
              "VAT-ready invoicing",
              "Driver document storage",
              "Reserved fleet allocation",
              "Free Greater Beirut delivery",
              "Quarterly business reviews",
              "Priority WhatsApp dispatch",
              "Replacement vehicle within 90 minutes",
            ].map((line) => (
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
            <p className="text-ink-60 overline">FAQ</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              Common questions.
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
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
            <h2 className="headline-lg text-ink-100">Talk to corporate sales</h2>
            <p className="body-md text-ink-60">
              Share a few details — we&apos;ll reply within one business day with a tailored quote
              and account-manager intro.
            </p>
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
            One car for a day?
          </h2>
          <p className="lead-md text-ink-30">Browse our daily-rental fleet or chat on WhatsApp.</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary-inverse" size="md">
              <Link href="/vehicles">Browse fleet</Link>
            </Button>
            <Button asChild variant="tertiary-inverse" size="md">
              <a href={whatsAppHref("default")} target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      <ServiceJsonLd
        name="Corporate car rental"
        description="Corporate fleet rental in Lebanon — dedicated cars, volume pricing, single monthly invoice, account management."
      />
    </>
  );
}

function ServiceJsonLd({ name, description }: { name: string; description: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: { "@type": "Organization", name: "Wheels Rent A Car" },
    areaServed: "Lebanon",
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
