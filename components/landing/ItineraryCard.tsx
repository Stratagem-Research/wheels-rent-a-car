import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/booking/pricing";
import type { Itinerary } from "@/types/domain";
import { getLocalizedString } from "@/lib/i18n/localized";

/**
 * ItineraryCard — Phase 12 (Sample Itineraries surface).
 *
 * Editorial card for chauffeur-led itineraries. Used in:
 *   - /chauffeur "Sample itineraries" scroll-right carousel
 *   - /itineraries listing grid
 *
 * Pattern: 4:5 photo on top with bottom scrim showing the title + duration;
 * body below the image with the excerpt, "From $X" price, and a tertiary
 * "View itinerary →" link. Whole card is a link to /itineraries/[slug].
 *
 * Surface stays paper so it reads against both paper (homepage) and ink-10
 * (chauffeur section, listing) backgrounds.
 */

export interface ItineraryCardProps {
  itinerary: Itinerary;
  locale?: string;
  className?: string;
}

export function ItineraryCard({ itinerary, locale = "en", className }: ItineraryCardProps) {
  return (
    <Link
      href={`/itineraries/${itinerary.slug}`}
      aria-label={`View ${getLocalizedString(itinerary.title, locale)} itinerary`}
      className={cn(
        "group bg-paper border-border flex h-full flex-col overflow-hidden rounded-xl border",
        "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
    >
      {/* Photo with bottom scrim — title + duration sit on top of the image. */}
      <div className="bg-ink-95 relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src={itinerary.coverImage.src}
          alt={getLocalizedString(itinerary.coverImage.alt, locale)}
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/75 via-black/30 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-5">
          <h3 className="headline-md text-paper leading-tight">
            {getLocalizedString(itinerary.title, locale)}
          </h3>
          <p className="label-md text-paper/85 inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {getLocalizedString(itinerary.duration, locale)}
          </p>
        </div>
      </div>

      {/* Body — excerpt + price + view-link. */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="body-sm text-ink-70 line-clamp-3">
          {getLocalizedString(itinerary.excerpt, locale)}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex flex-col">
            <span className="label-md text-ink-50">From</span>
            <span className="price-md text-ink-100 tabular-nums">
              {formatUsd(itinerary.priceFromCents)}
            </span>
          </div>
          <span className="button-md text-ink-100 inline-flex items-center gap-1.5 underline-offset-4 group-hover:underline">
            View itinerary
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
