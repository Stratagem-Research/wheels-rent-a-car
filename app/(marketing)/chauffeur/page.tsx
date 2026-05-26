"use client";

import * as React from "react";
import Link from "next/link";
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
import { EnquiryFormChauffeur } from "@/components/leads/EnquiryFormChauffeur";
import { useItineraries } from "@/lib/admin/useAdminStore";
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

const CATEGORIES: Array<{
  id: ServiceType;
  icon: React.ReactNode;
  title: string;
  body: string;
  from: string;
}> = [
  {
    id: "airport",
    icon: <Plane className="size-5" aria-hidden="true" />,
    title: "Airport transfer",
    body: "Beirut Airport ↔ hotel, day or night. Driver waits up to 90 minutes for delayed flights, no extra charge.",
    from: "from $45",
  },
  {
    id: "day-trip",
    icon: <MapPinned className="size-5" aria-hidden="true" />,
    title: "Day trip",
    body: "Cedars, Baalbek, Byblos, Tyre — full-day itineraries with admissions and lunch stops sorted.",
    from: "from $180",
  },
  {
    id: "by-the-hour",
    icon: <Clock className="size-5" aria-hidden="true" />,
    title: "By the hour",
    body: "Minimum 4 hours. Sedan, SUV, or van. Perfect for meetings, weddings, or city exploration.",
    from: "from $35 / hour",
  },
];

const VEHICLE_CLASSES = [
  {
    title: "Sedan",
    body: "Mercedes E-Class or similar — 2 to 3 passengers, executive comfort.",
  },
  {
    title: "SUV",
    body: "Mercedes GLE or similar — 4 to 5 passengers, generous boot.",
  },
  {
    title: "Van",
    body: "Mercedes V-Class or similar — up to 7 passengers, family-ready.",
  },
];

const TRUST = [
  {
    icon: <Award className="size-5" aria-hidden="true" />,
    title: "Hand-picked",
    body: "Every driver is vetted, licensed, and trained in customer service.",
  },
  {
    icon: <ShieldCheck className="size-5" aria-hidden="true" />,
    title: "Background checked",
    body: "Police certificate and driving record verified annually.",
  },
  {
    icon: <Plane className="size-5" aria-hidden="true" />,
    title: "Local expertise",
    body: "They know every Beirut shortcut and the best lunch on every itinerary.",
  },
];

const HOW_IT_WORKS = [
  { title: "Tell us the trip", body: "Pickup, drop-off, and date. 30 seconds." },
  { title: "We assign a driver", body: "Within 24 hours we send the driver bio + final quote." },
  { title: "Sit back", body: "Driver picks you up at the agreed time. Pay in cash or by card." },
];

const FAQS = [
  {
    id: "same-day",
    q: "Can I book same-day?",
    a: "Subject to availability. Message us on WhatsApp for same-day requests and we'll confirm within 15 minutes.",
  },
  {
    id: "tip",
    q: "Is the tip included?",
    a: "No — gratuity is at your discretion. The driver appreciates the courtesy but does not expect it.",
  },
  {
    id: "lang",
    q: "Do drivers speak English?",
    a: "Yes. Arabic and French are widely available too — note your preference in the booking.",
  },
  {
    id: "wait",
    q: "What if my flight is delayed?",
    a: "Airport drivers wait up to 90 minutes past your scheduled landing at no extra charge. We track the flight live.",
  },
  {
    id: "luggage",
    q: "How much luggage fits?",
    a: "Sedan: 2 large + 2 cabin. SUV: 4 large + 4 cabin. Van: 7 large + handhelds. Tell us if you're carrying extras.",
  },
];

export default function ChauffeurPage() {
  const [serviceType, setServiceType] = React.useState<ServiceType>("airport");
  const itineraries = useItineraries();

  const requestService = (type: ServiceType) => {
    setServiceType(type);
    if (typeof window !== "undefined") {
      document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Inverse hero band — paper text on ink-100. The lead-paragraph + white
       * pill CTA pattern matches /long-term so the two service pages read as
       * a pair. */}
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">Chauffeur</p>
          <h1 className="display-xl text-paper mt-3 text-[clamp(48px,7vw,88px)] leading-[0.96]">
            Sit back.
            <br />
            We&apos;ll handle the driving.
          </h1>
          <p className="lead-lg text-ink-30 mt-5 max-w-2xl">
            Airport transfers, day trips, and hourly hire — with vetted, English-speaking drivers
            and premium vehicles.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="primary-inverse" size="lg">
              <a href="#enquiry">Request a driver</a>
            </Button>
            <Button asChild variant="tertiary-inverse" size="lg">
              <a href={whatsAppHref("default")} target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Three service categories — paper canvas, ink cards. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">Three formats</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              Three ways to ride.
            </h2>
            <p className="lead-md text-ink-60 mt-1">
              Pick the format that matches your trip. We&apos;ll handle the rest.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Card variant="default" className="flex h-full flex-col gap-3 rounded-xl p-6">
                  <span className="bg-ink-10 text-ink-100 inline-flex size-10 items-center justify-center rounded-md">
                    {c.icon}
                  </span>
                  <h3 className="headline-md text-ink-100 mt-1">{c.title}</h3>
                  <p className="body-md text-ink-60">{c.body}</p>
                  <p className="label-md text-ink-50 mt-1">{c.from}</p>
                  <div className="mt-auto pt-4">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => requestService(c.id)}
                    >
                      Request {c.title.toLowerCase()}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Vehicle classes — tinted band. */}
      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">The fleet</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              Vehicle classes.
            </h2>
            <p className="body-md text-ink-60 mt-1">
              All vehicles under 3 years old. Detailed before every trip.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {VEHICLE_CLASSES.map((v) => (
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
            <p className="text-ink-60 overline">Booking flow</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              How it works.
            </h2>
          </div>
          <HowItWorksRow steps={HOW_IT_WORKS} className="mt-10 lg:grid-cols-3" />
        </div>
      </section>

      {/* Sample itineraries — scroll-right carousel of our most-requested
       * chauffeur-led tours, with "See all itineraries →" routing to the
       * dedicated /itineraries listing page. Pulls from the ITINERARIES
       * fixture (admin CRUD overlays this via lib/admin/store.ts). */}
      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end lg:mb-14">
            <div className="flex max-w-2xl flex-col gap-3">
              <p className="text-ink-60 overline">Most-requested</p>
              <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
                Sample itineraries.
              </h2>
              <p className="body-md text-ink-60 mt-1">
                A handful of our most-requested day trips. Scroll for more, or tell us where you
                want to go and we&apos;ll build anything custom.
              </p>
            </div>
            <Link
              href="/itineraries"
              className="button-md text-ink-100 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
            >
              See all itineraries
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:gap-6">
            {itineraries.slice(0, 6).map((itin) => (
              <li
                key={itin.slug}
                className="w-[82%] min-w-0 shrink-0 snap-start sm:w-[55%] lg:w-[32%]"
              >
                <ItineraryCard itinerary={itin} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* About our drivers — paper canvas. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-ink-60 overline">The team</p>
            <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
              About our drivers.
            </h2>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {TRUST.map((t) => (
              <li key={t.title}>
                <Card variant="default" className="flex flex-col gap-2 rounded-xl p-6">
                  <span className="bg-ink-10 text-ink-100 inline-flex size-10 items-center justify-center rounded-md">
                    {t.icon}
                  </span>
                  <h3 className="headline-sm text-ink-100 mt-1">{t.title}</h3>
                  <p className="body-md text-ink-60">{t.body}</p>
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

      {/* Enquiry form — same INK & SIGNAL card pattern as /long-term. The
       * red `cta` submit is the singular red on the page. */}
      <section id="enquiry" className="bg-ink-10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <Card variant="default" className="flex flex-col gap-3 rounded-xl p-8">
            <h2 className="headline-lg text-ink-100">Request a driver</h2>
            <p className="body-md text-ink-60">
              Share the basics — we&apos;ll reply within one business day with a quote and driver
              assignment.
            </p>
            <p className="label-md text-warning mt-1">
              Need a same-day pickup? Message us on WhatsApp first for the fastest response.
            </p>
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
            Rather drive yourself?
          </h2>
          <p className="lead-md text-ink-30">Our self-drive fleet is across the page.</p>
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
        name="Chauffeur service"
        description="Professional chauffeur service in Lebanon — airport transfers, day trips, and hourly hire with vetted, English-speaking drivers."
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
