"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * CategoryWordmarkCard (landingpage.md §2) — the Rivian-pattern card.
 *
 * The category name is set MASSIVE behind the vehicle image (Rivian
 * pattern). The vehicle photo overlays the wordmark visually. The whole
 * card is clickable; the two pill buttons inside are explicit secondary
 * affordances and don't break the card link.
 *
 * Surface: the same dark radial gradient as VehicleCard so the silver /
 * white-toned car photos POP off the surface and the home/listing pages
 * read as one design system. The card-tint (ink-10) variant the spec
 * originally called for is only ~4% darker than paper, which against the
 * near-white car PNGs produced a misleading "white box around the car"
 * perception even though no white background existed in the DOM.
 *
 * Price + description treatment follows the VehicleCard pattern: the
 * description is its own `body-md` line in paper/70, the price is a
 * separate row using `price-md` + tabular-nums with the dollar amount
 * bigger and Extra Bold — visually paired with the dark fleet cards.
 */

/** Single source of truth: --gradient-card-dark in styles/tokens.css. */
const CARD_GRADIENT_DARK = "var(--gradient-card-dark)";

export interface CategoryWordmarkCardProps {
  categoryName: string;
  image: { src: string; alt: string; width: number; height: number };
  description: string;
  priceFromUSD: number;
  slug: string;
  /** Internal href for the EXPLORE pill (defaults to /vehicles?category=slug). */
  exploreHref?: string;
  /** Internal href for the BOOK pill (defaults to /book?category=slug). */
  bookHref?: string;
  className?: string;
}

export function CategoryWordmarkCard({
  categoryName,
  image,
  description,
  priceFromUSD,
  slug,
  exploreHref,
  bookHref,
  className,
}: CategoryWordmarkCardProps) {
  const exploreTo = exploreHref ?? `/vehicles?category=${slug}`;
  const bookTo = bookHref ?? `/book?category=${slug}`;

  return (
    <article
      className={cn(
        "group text-paper relative isolate flex h-full flex-col overflow-hidden",
        "bg-ink-95 rounded-xl",
        "min-h-[460px] sm:min-h-[520px]",
        "px-6 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-10",
        className,
      )}
      style={{ backgroundImage: CARD_GRADIENT_DARK }}
    >
      {/* Massive wordmark — sits BEHIND the vehicle image (Rivian pattern).
       * Paper at low opacity reads as a soft backdrop on the dark surface
       * without overpowering the photo. Absolutely positioned so the image
       * can overlap. Clamped scale + whitespace-nowrap so multi-word labels
       * like "7-Seater" stay one line. */}
      <h3
        aria-hidden="true"
        className={cn(
          "absolute top-6 left-6 sm:top-8 sm:left-10",
          "text-paper/15 font-extrabold uppercase",
          "text-[clamp(64px,10vw,128px)] leading-[0.9] tracking-[-0.04em]",
          "pointer-events-none whitespace-nowrap select-none",
        )}
      >
        {categoryName}
      </h3>

      {/* Vehicle image — sits in normal flow and visually overlaps the wordmark. */}
      <div className="relative z-[1] mt-16 flex flex-1 items-center justify-center sm:mt-20">
        <div className="relative aspect-[16/10] w-full max-w-[460px]">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 600px, (min-width: 640px) 540px, 85vw"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </div>

      {/* Description + price — styled to match the VehicleCard rhythm:
       * single-line description in body-md, price row underneath with the
       * dollar amount set big and Extra Bold via price-md. */}
      <div className="relative z-[1] mt-6 flex flex-col gap-2">
        <p className="body-md text-paper/70 max-w-md">{description}</p>
        <p className="price-md text-paper tabular-nums">
          <span className="body-sm text-paper/60 font-medium">From</span>{" "}
          <span className="text-[1.4em] font-extrabold">${priceFromUSD}</span>{" "}
          <span className="body-sm text-paper/80 font-medium">/day</span>
        </p>
      </div>

      {/* Single primary CTA — Book. Dropped the "Explore" outline pill;
       * the whole card already navigates to the explore route, so the
       * extra button was redundant. Book bumped from sm → md for more
       * presence as the only visible action on the card. */}
      <div className="relative z-[1] mt-5 flex flex-wrap items-center gap-2">
        <Button asChild variant="primary-inverse" size="md">
          <Link href={bookTo} aria-label={`Book ${categoryName.toLowerCase()}`}>
            Book
          </Link>
        </Button>
      </div>

      {/* Whole-card overlay link — sits at the lowest z-index so the inner
       * pills are still clickable above it. */}
      <Link
        href={exploreTo}
        aria-label={`Browse ${categoryName.toLowerCase()} vehicles`}
        className={cn(
          "absolute inset-0 z-0",
          "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
          "rounded-xl",
        )}
      />
    </article>
  );
}

/**
 * Title-case helper for category labels. Keeps the wordmark uppercase via CSS
 * `text-transform`, so we feed it title-case-stable strings.
 */
export function categoryDisplayName(slug: string): string {
  switch (slug) {
    case "7-seater":
      return "7-Seater";
    case "suv":
      return "SUV";
    case "luxury":
      return "Luxury";
    case "sedan":
      return "Sedan";
    case "compact":
      return "Compact";
    case "economy":
      return "Economy";
    default:
      return slug;
  }
}
