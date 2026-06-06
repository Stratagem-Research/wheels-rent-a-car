"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
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
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { EnquiryFormLongTerm } from "@/components/leads/EnquiryFormLongTerm";
import { LONG_TERM_TIERS } from "@/lib/api/mocks/fixtures/catalog";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import { whatsAppHref } from "@/lib/whatsapp";

const HOW_IT_WORKS = [
  { title: "Tell us what you need", body: "Fill the enquiry form. Takes 30 seconds." },
  { title: "We send you a tailored quote", body: "Within 24 hours. Vehicles, included km, terms." },
  { title: "We deliver the car to you", body: "Free delivery anywhere in Greater Beirut." },
];

const INCLUSIONS = [
  "Comprehensive insurance",
  "Free maintenance and servicing",
  "Replacement vehicle if yours needs work",
  "Roadside assistance 24/7",
  "Free swap to a different car class once / quarter",
  "Monthly billing — no upfront full payment",
  "Free delivery within Greater Beirut",
  "WhatsApp account manager",
];

const FAQS = [
  {
    id: "min",
    q: "What's the minimum commitment?",
    a: "One month is the minimum. Below that, our daily / weekly rentals are a better fit.",
  },
  {
    id: "cancel",
    q: "Can I cancel early?",
    a: "Yes. Early termination incurs the difference between the tier rate you chose and the next-shorter tier rate, calculated against the days you actually drove.",
  },
  {
    id: "maint",
    q: "What happens to maintenance?",
    a: "Wheels handles all servicing. Drop the car off; we hand you a replacement; you pick it back up.",
  },
  {
    id: "swap",
    q: "Can I swap to a different car?",
    a: "Yes — once per quarter for free on tiers ≥ 3 months. Same category swaps are easy; category upgrades adjust the daily rate.",
  },
  {
    id: "deposit",
    q: "Is the deposit different for long-term?",
    a: "Same deposit by category as a day rental. It's released after the final return.",
  },
  {
    id: "billing",
    q: "How is monthly billing handled?",
    a: "First month at start; subsequent months on the same date by card or transfer. A single statement at the end of each calendar month.",
  },
];

export default function LongTermPage() {
  const [duration, setDuration] = React.useState<"1" | "3" | "6" | "12">("6");

  const scrollToForm = (months: 1 | 3 | 6 | 12) => {
    setDuration(String(months) as "1" | "3" | "6" | "12");
    if (typeof window !== "undefined") {
      document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Inverse hero band — paper text, white-pill CTA (red stays for the form). */}
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">One month +</p>
          <h1 className="display-xl text-paper mt-3 text-[clamp(48px,7vw,88px)] leading-[0.96]">
            Drive longer.
            <br />
            Save more.
          </h1>
          <p className="lead-lg text-ink-30 mt-5 max-w-2xl">
            Monthly and multi-month rentals from $17 a day. Perfect for expats, families, and
            businesses staying a while.
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

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">Tiers</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              Pick your tier.
            </h2>
            <p className="lead-md text-ink-60 mt-1">Longer commitments unlock lower daily rates.</p>
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
            <p className="text-ink-60 overline">From quote to keys</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              How it works.
            </h2>
          </div>
          <HowItWorksRow steps={HOW_IT_WORKS} className="mt-10 lg:grid-cols-3" />
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">What you get</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              Everything included.
            </h2>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUSIONS.map((line) => (
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
            <p className="text-ink-40 overline">Driver favourites</p>
            <h2 className="display-md text-paper text-[clamp(32px,4.5vw,56px)] leading-[1]">
              Cars our long-term clients love.
            </h2>
          </div>
          <ul className="mt-10 grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 sm:gap-6 lg:auto-cols-[minmax(0,1fr)] lg:grid-flow-row lg:grid-cols-3">
            {VEHICLES.filter((v) => ["sedan", "suv"].includes(v.category))
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

      <section id="enquiry" className="bg-ink-10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <Card variant="default" className="flex flex-col gap-3 rounded-xl p-8">
            <h2 className="headline-lg text-ink-100">Get a quote</h2>
            <p className="body-md text-ink-60">We&apos;ll come back to you within 24 hours.</p>
            <div className="mt-4">
              <EnquiryFormLongTerm initialDuration={duration} />
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-ink-100 text-paper">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-5 py-16 text-center sm:px-10 lg:py-24">
          <h2 className="display-md text-paper text-[clamp(32px,4.5vw,56px)] leading-[1]">
            Need it sooner?
          </h2>
          <p className="lead-md text-ink-30">Day rentals are also available.</p>
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
        name="Long-term car rental"
        description="Monthly and multi-month car rentals across Lebanon with insurance, maintenance, and replacement vehicle."
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
