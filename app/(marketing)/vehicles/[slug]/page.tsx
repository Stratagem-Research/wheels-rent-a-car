import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Check, Cog, DoorOpen, Fuel, Gauge, Users, Wrench } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VehicleImageSlider } from "@/components/vehicle/VehicleImageSlider";
import { formatUsd } from "@/lib/booking/pricing";
import { vehicleDisplayName } from "@/lib/vehicles/display-name";
import { getVehicleBySlug } from "@/lib/server/vehicles-service";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";
import { vehiclePageKey } from "@/lib/supabase/seo-repository";
import type { Vehicle, VehicleBadge } from "@/types/domain";

/**
 * /vehicles/[slug] — dedicated, crawlable page per vehicle model. Additive:
 * the fast inline-expansion browsing on /vehicles is untouched. This page's
 * only entry points are the sitemap, a direct URL, and the small icon-link
 * added to VehicleCardExpanded — nothing in the booking flow changes.
 *
 * `pageKey: vehiclePageKey(vehicle.slug)` reuses the exact `page_seo` row
 * seeded by ensureVehicleSeoRows() (see lib/supabase/seo-repository.ts) —
 * keyed by slug, not by unit, since every unit of the same model shares
 * this one page. Editing a vehicle's SEO in /admin/seo now actually renders
 * here.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

const BADGE_KEY: Record<NonNullable<VehicleBadge>, string> = {
  "best-deal": "badgeBestDeal",
  popular: "badgePopular",
  new: "badgeNew",
};

const BADGE_VARIANT: Record<
  NonNullable<VehicleBadge>,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  "best-deal": "bestDeal",
  popular: "popular",
  new: "new",
};

function fallbackTitleFor(vehicle: Vehicle): string {
  return `Rent ${vehicleDisplayName(vehicle)} ${vehicle.year} in Lebanon | Wheels Rent A Car`;
}

function fallbackDescriptionFor(vehicle: Vehicle): string {
  const label = vehicleDisplayName(vehicle);
  const transmission = vehicle.transmission === "automatic" ? "automatic" : "manual";
  return (
    vehicle.tagline?.trim() ||
    `Rent a ${label} ${vehicle.year} in Lebanon. ${vehicle.seats}-seat ${transmission}, free Hazmieh pickup, 24/7 WhatsApp support.`
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const [locale, vehicle] = await Promise.all([getLocale(), getVehicleBySlug(slug)]);
  if (!vehicle) {
    const t = await getTranslations("fleet");
    return { title: t("pdpNotFoundTitle") };
  }

  return resolvePageMetadata({
    pageKey: vehiclePageKey(vehicle.slug),
    locale,
    fallbackTitle: fallbackTitleFor(vehicle),
    fallbackDescription: fallbackDescriptionFor(vehicle),
    path: `/vehicles/${vehicle.slug}`,
    fallbackImage: vehicle.images[0]?.url,
  });
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [vehicle, t] = await Promise.all([getVehicleBySlug(slug), getTranslations("fleet")]);
  if (!vehicle) notFound();

  const label = vehicleDisplayName(vehicle);
  const priceLabel = formatUsd(vehicle.dailyRateFromCents);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: label,
    description: fallbackDescriptionFor(vehicle),
    image: vehicle.images.map((img) => img.url),
    brand: { "@type": "Brand", name: vehicle.make },
    offers: {
      "@type": "Offer",
      price: (vehicle.dailyRateFromCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-(--container-default) px-4 pt-8 pb-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* LEFT — photo + title + description + features */}
          <div className="flex flex-col gap-6">
            <div className="relative">
              <VehicleImageSlider
                images={vehicle.images}
                sizes="(min-width: 1024px) 640px, 100vw"
                priority
              />
              {vehicle.badge ? (
                <div className="absolute top-3 left-3 z-20">
                  <Badge variant={BADGE_VARIANT[vehicle.badge]}>{t(BADGE_KEY[vehicle.badge])}</Badge>
                </div>
              ) : null}
            </div>

            <div>
              <h1 className="display-md text-ink-100 text-[clamp(24px,4vw,40px)] leading-[1.05]">
                {label} {vehicle.year}
              </h1>
              {vehicle.tagline ? <p className="body-md text-ink-60 mt-2">{vehicle.tagline}</p> : null}
              {vehicle.description ? (
                <p className="body-md text-ink-70 mt-4 whitespace-pre-line">{vehicle.description}</p>
              ) : null}
            </div>

            {vehicle.features.length > 0 ? (
              <section>
                <h2 className="headline-sm text-ink-100 mb-3">{t("pdpFeatures")}</h2>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {vehicle.features.map((feature) => (
                    <li key={feature} className="body-sm text-ink-80 flex items-center gap-2">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* RIGHT — specs, then price + CTA below */}
          <aside className="flex h-fit flex-col gap-6 lg:sticky lg:top-24">
            <section>
              <h2 className="headline-sm text-ink-100 mb-3">{t("pdpSpecs")}</h2>
              <ul className="grid grid-cols-2 gap-3">
                <SpecTile icon={<Users className="size-4" aria-hidden="true" />} label={t("seatsLabel", { count: vehicle.seats })} />
                <SpecTile icon={<Briefcase className="size-4" aria-hidden="true" />} label={t("bagsLabel", { count: vehicle.bags })} />
                <SpecTile icon={<DoorOpen className="size-4" aria-hidden="true" />} label={t("doorsLabel", { count: vehicle.doors })} />
                <SpecTile
                  icon={<Cog className="size-4" aria-hidden="true" />}
                  label={t(vehicle.transmission === "automatic" ? "transAutomatic" : "transManual")}
                />
                <SpecTile icon={<Fuel className="size-4" aria-hidden="true" />} label={capitalize(vehicle.fuel)} />
                {vehicle.engine ? (
                  <SpecTile icon={<Wrench className="size-4" aria-hidden="true" />} label={vehicle.engine} />
                ) : null}
              </ul>
            </section>

            <div className="border-border bg-paper flex flex-col gap-4 rounded-xl border p-6">
              <div className="flex items-baseline gap-1">
                <span className="price-md text-ink-100 text-[1.5em] font-extrabold tabular-nums">
                  {priceLabel}
                </span>
                <span className="body-sm text-ink-60">{t("perDay")}</span>
              </div>
              <Button asChild variant="cta" size="lg" fullWidth>
                <Link href={`/vehicles?selected=${encodeURIComponent(vehicle.id)}`}>
                  {t("pdpCheckAvailability")}
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function SpecTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="bg-ink-10 text-ink-80 label-md flex items-center gap-2 rounded-lg px-3 py-2.5">
      {icon}
      {label}
    </li>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
