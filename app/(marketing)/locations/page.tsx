import { Building2, Phone, MessageCircle, MapPin, ParkingCircle } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { SearchBar } from "@/components/search/SearchBar";
import { BRANCHES } from "@/lib/api/mocks/fixtures/branches";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import { whatsAppHref } from "@/lib/whatsapp";

export const metadata = {
  title: "Visit Us in Hazmieh · Wheels Rent A Car",
  description:
    "Wheels Hazmieh — Gallery Semaan, facing Sea Sweet, next to Lancaster Tamar Hotel, Beirut, Lebanon. Pick up your car at our branch or message us on WhatsApp.",
};

const BRANCH_FAQS = [
  {
    id: "after-hours",
    q: "Can I pick up after hours?",
    a: "We're open Monday–Saturday 08:00–20:00 and Sunday 10:00–16:00. For pickups outside those hours, message us on WhatsApp and we'll arrange.",
  },
  {
    id: "delivery",
    q: "Can you deliver the car to my hotel or the airport?",
    a: "Yes — we can drop off and collect anywhere in Greater Beirut. WhatsApp us to arrange and we'll confirm any small distance fee before pickup.",
  },
  {
    id: "parking",
    q: "Where do I park to pick up?",
    a: "There's short-term parking right outside Gallery Semaan. Look for the Wheels signage and our agent will help.",
  },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function localBusinessJsonLd(branch: (typeof BRANCHES)[number]) {
  return {
    "@context": "https://schema.org",
    "@type": "CarRental",
    name: `Wheels ${branch.name}`,
    url: "https://wheelsrentacar.com.lb/locations",
    telephone: branch.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.address,
      addressLocality: branch.city,
      addressCountry: "LB",
    },
    geo: { "@type": "GeoCoordinates", latitude: branch.lat, longitude: branch.lng },
    openingHours: branch.hours.map(
      (h) => `${["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][h.day]} ${h.open}-${h.close}`,
    ),
  };
}

export default function LocationsPage() {
  const branch = BRANCHES[0]!;
  const localFleet = VEHICLES.slice(0, 6);
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${branch.lat},${branch.lng}`)}`;

  return (
    <>
      {/* Inverse hero — display-xl, single Hazmieh branch. */}
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">Our hub</p>
          <h1 className="display-xl text-paper mt-3 text-[clamp(48px,7vw,88px)] leading-[0.98]">
            Visit us in Hazmieh.
          </h1>
          <p className="lead-lg text-ink-30 mt-4 max-w-2xl">{branch.address}</p>
        </div>
      </header>

      {/* Search bar sits on a paper canvas below the hero. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-10 sm:px-10 lg:py-14">
          <SearchBar branches={BRANCHES} variant="expanded" />
        </div>
      </section>

      {/* Address + hours stack (card-tint) alongside the about/parking copy. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 pb-16 sm:px-10 lg:pb-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-6">
              <div
                aria-hidden="true"
                className="bg-ink-10 flex aspect-[16/9] items-center justify-center rounded-xl"
              >
                <Building2 className="text-ink-60 size-16 opacity-60" />
              </div>
              <div>
                <h2 className="headline-lg text-ink-100">About this branch</h2>
                <p className="body-lg text-ink-80 mt-4 max-w-[640px] leading-relaxed">
                  Wheels Hazmieh is our home branch. Drop in to pick up your car, or message us on
                  WhatsApp and we&apos;ll arrange delivery anywhere in Greater Beirut — including
                  Beirut Airport.
                </p>
              </div>

              <Card variant="default" className="flex flex-col gap-3 rounded-xl">
                <span className="bg-ink-100 text-paper inline-flex size-10 items-center justify-center rounded-lg">
                  <ParkingCircle className="size-5" aria-hidden="true" />
                </span>
                <h3 className="headline-sm text-ink-100">Parking & access</h3>
                <ul className="body-md text-ink-80 mt-2 flex flex-col gap-1.5">
                  <li>· Short-term parking right outside Gallery Semaan.</li>
                  <li>· Look for the Wheels signage at the entrance.</li>
                  <li>· Step-free access from the street; ground-floor counter.</li>
                </ul>
              </Card>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-ink-10 flex flex-col gap-5 rounded-xl p-6">
                <div>
                  <h3 className="text-ink-60 mb-2 overline">Address</h3>
                  <p className="body-md text-ink-95">{branch.address}</p>
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-md text-ink-100 mt-2 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
                  >
                    <MapPin className="size-3.5" aria-hidden="true" /> Get directions
                  </a>
                </div>

                <hr className="border-border-strong" />

                <div>
                  <h3 className="text-ink-60 mb-2 overline">Hours</h3>
                  <ul className="body-sm text-ink-80 flex flex-col gap-1">
                    {DAY_NAMES.map((name, dayIndex) => {
                      const slot = branch.hours.find((h) => h.day === dayIndex);
                      return (
                        <li key={name} className="flex items-baseline justify-between gap-3">
                          <span>{name}</span>
                          <span className="mono-md text-ink-60 tabular-nums">
                            {!slot
                              ? "Closed"
                              : slot.open24h
                                ? "24h"
                                : `${slot.open} – ${slot.close}`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <hr className="border-border-strong" />

                <div className="flex flex-col gap-2">
                  <a
                    href={`tel:${branch.phone.replace(/\s/g, "")}`}
                    className="body-md text-ink-95 hover:text-ink-100 inline-flex items-center gap-2"
                  >
                    <Phone className="text-ink-100 size-4" aria-hidden="true" />
                    {branch.phone}
                  </a>
                  {branch.whatsapp ? (
                    <a
                      href={whatsAppHref("default")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="body-md text-ink-95 hover:text-ink-100 inline-flex items-center gap-2"
                    >
                      <MessageCircle className="size-4 text-[#25D366]" aria-hidden="true" />
                      WhatsApp
                    </a>
                  ) : null}
                </div>

                <Button asChild variant="primary" size="md" fullWidth>
                  <Link href={`/vehicles?pickupLoc=${branch.id}`}>Browse cars</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <h2 className="headline-lg text-ink-100">Cars usually at our branch</h2>
          <ul className="mt-8 grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 sm:gap-6 lg:auto-cols-[minmax(0,1fr)] lg:grid-flow-row lg:grid-cols-3">
            {localFleet.map((v) => (
              <li key={v.id}>
                <VehicleCard vehicle={v} variant="light" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <h2 className="headline-lg text-ink-100">Common questions</h2>
          <Accordion type="single" collapsible className="mt-6">
            {BRANCH_FAQS.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(branch)) }}
      />
    </>
  );
}
