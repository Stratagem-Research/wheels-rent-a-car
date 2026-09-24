import { Phone, MessageCircle, MapPin, ParkingCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { PageHero } from "@/components/marketing/PageHero";
import { PAGE_HERO_IMAGES, HAZMIEH_BRANCH_IMAGE } from "@/lib/marketing/hero-images";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { SearchBar } from "@/components/search/SearchBar";
import type { Branch } from "@/types/domain";
import { getPublicBranches, getPublicVehicles } from "@/lib/server/public-content";
import { whatsAppHref } from "@/lib/whatsapp";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/locations",
    locale,
    fallbackTitle: t("locationsTitle"),
    fallbackDescription: t("locationsDescription"),
    path: "/locations",
  });
}

function localBusinessJsonLd(branch: Branch) {
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

export default async function LocationsPage() {
  const t = await getTranslations("locations");
  const dayNames = t.raw("days") as string[];
  const parkingItems = t.raw("parkingItems") as string[];
  const faqs = t.raw("faqs") as { q: string; a: string }[];
  const branches = await getPublicBranches();
  const vehicles = await getPublicVehicles();
  const branch = branches[0]!;
  const localFleet = vehicles.slice(0, 6);
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${branch.lat},${branch.lng}`)}`;

  return (
    <>
      {/* Cinematic photo-backed hero — see lib/marketing/hero-images.ts. */}
      <PageHero
        overline={t("eyebrow")}
        headline={t("heroHeading")}
        headlineClassName="display-xl text-[clamp(48px,7vw,88px)] leading-[0.98]"
        lead={branch.address}
        image={PAGE_HERO_IMAGES.locations}
      />

      {/* Search bar sits on a paper canvas below the hero. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-10 sm:px-10 lg:py-14">
          <SearchBar branches={branches} variant="expanded" />
        </div>
      </section>

      {/* Address + hours stack (card-tint) alongside the about/parking copy. */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 pb-16 sm:px-10 lg:pb-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-6">
              <div className="bg-ink-10 relative aspect-[16/9] overflow-hidden rounded-xl">
                <Image
                  src={HAZMIEH_BRANCH_IMAGE.src}
                  alt={HAZMIEH_BRANCH_IMAGE.alt}
                  fill
                  sizes="(min-width: 1024px) 760px, 100vw"
                  className="object-cover"
                  style={{ objectPosition: HAZMIEH_BRANCH_IMAGE.position }}
                />
              </div>
              <div>
                <h2 className="headline-lg text-ink-100">{t("aboutHeading")}</h2>
                <p className="body-lg text-ink-80 mt-4 max-w-[640px] leading-relaxed">
                  {t("aboutBody")}
                </p>
              </div>

              <Card variant="default" className="flex flex-col gap-3 rounded-xl">
                <span className="bg-ink-100 text-paper inline-flex size-10 items-center justify-center rounded-lg">
                  <ParkingCircle className="size-5" aria-hidden="true" />
                </span>
                <h3 className="headline-sm text-ink-100">{t("parkingHeading")}</h3>
                <ul className="body-md text-ink-80 mt-2 flex flex-col gap-1.5">
                  {parkingItems.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </Card>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-ink-10 flex flex-col gap-5 rounded-xl p-6">
                <div>
                  <h3 className="text-ink-60 mb-2 overline">{t("addressLabel")}</h3>
                  <p className="body-md text-ink-95">{branch.address}</p>
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-md text-ink-100 mt-2 inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
                  >
                    <MapPin className="size-3.5" aria-hidden="true" /> {t("getDirections")}
                  </a>
                </div>

                <hr className="border-border-strong" />

                <div>
                  <h3 className="text-ink-60 mb-2 overline">{t("hoursLabel")}</h3>
                  <ul className="body-sm text-ink-80 flex flex-col gap-1">
                    {dayNames.map((name, dayIndex) => {
                      const slot = branch.hours.find((h) => h.day === dayIndex);
                      return (
                        <li key={name} className="flex items-baseline justify-between gap-3">
                          <span>{name}</span>
                          <span className="mono-md text-ink-60 tabular-nums">
                            {!slot
                              ? t("closed")
                              : slot.open24h
                                ? t("open24h")
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
                      href={whatsAppHref("default", {}, branch.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="body-md text-ink-95 hover:text-ink-100 inline-flex items-center gap-2"
                    >
                      <MessageCircle className="size-4 text-[#25D366]" aria-hidden="true" />
                      {t("whatsapp")}
                    </a>
                  ) : null}
                </div>

                <Button asChild variant="primary" size="md" fullWidth>
                  <Link href={`/vehicles?pickupLoc=${branch.id}`}>{t("browseCars")}</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <h2 className="headline-lg text-ink-100">{t("fleetHeading")}</h2>
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
          <h2 className="headline-lg text-ink-100">{t("faqHeading")}</h2>
          <Accordion type="single" collapsible className="mt-6">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
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
