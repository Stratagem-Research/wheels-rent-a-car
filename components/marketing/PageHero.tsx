import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * PageHero — cinematic photo-backed page opener for the secondary marketing
 * routes (trips, itineraries, chauffeur, corporate, long-term, locations,
 * contact, about).
 *
 * Mirrors the home `Hero` language: a full-bleed Lebanon photograph (no radius,
 * per DESIGN.md "hero imagery is full-bleed") under a dark gradient scrim, with
 * paper-coloured type that holds WCAG AA over the photo.
 *
 * Drop-in safe: when `image` is omitted it renders the legacy solid
 * `bg-ink-100 text-paper` band verbatim, so pages without final art still look
 * correct. All hero photography is routed through `lib/marketing/hero-images.ts`
 * so the client's final shots swap in without touching this component.
 *
 * The hero is the LCP element on its route, so the photo is loaded with
 * `priority`. It sits below the global solid header (no `-mt` overlay trick),
 * which keeps header/layout logic untouched.
 */

export interface PageHeroImage {
  src: string;
  alt: string;
  /** CSS object-position, e.g. "center 40%". Defaults to "center". */
  position?: string;
}

export interface PageHeroProps {
  overline: string;
  headline: React.ReactNode;
  lead?: React.ReactNode;
  image?: PageHeroImage;
  /** CTA / button row rendered below the lead. */
  actions?: React.ReactNode;
  align?: "left" | "center";
  /** Override the default headline sizing (defaults to display-xl clamp). */
  headlineClassName?: string;
  className?: string;
}

const DEFAULT_HEADLINE_CLASS = "display-xl text-[clamp(48px,7vw,88px)] leading-[0.96]";

export function PageHero({
  overline,
  headline,
  lead,
  image,
  actions,
  align = "left",
  headlineClassName,
  className,
}: PageHeroProps) {
  const hasImage = Boolean(image);
  const centered = align === "center";

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden",
        hasImage ? "bg-ink-95 text-paper" : "bg-ink-100 text-paper",
        className,
      )}
    >
      {image ? (
        <>
          {/* Full-bleed cinematic photograph — LCP candidate. */}
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover"
            style={{ objectPosition: image.position ?? "center" }}
          />
          {/* Dark gradient scrim — heavier top and bottom so the header above
           * and the type/CTAs below both clear contrast. Mirrors the home hero. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.45)_45%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.7)_100%)]"
          />
        </>
      ) : null}

      <div
        className={cn(
          "mx-auto max-w-[var(--container-default)] px-5 py-20 sm:px-10 lg:py-28",
          centered && "flex flex-col items-center text-center",
        )}
      >
        <p className={cn("overline", hasImage ? "text-paper/70" : "text-ink-40")}>{overline}</p>
        <h1
          className={cn(
            "text-paper mt-3",
            headlineClassName ?? DEFAULT_HEADLINE_CLASS,
          )}
        >
          {headline}
        </h1>
        {lead ? (
          <p
            className={cn(
              "lead-lg mt-5 max-w-2xl",
              hasImage ? "text-paper/85" : "text-ink-30",
            )}
          >
            {lead}
          </p>
        ) : null}
        {actions ? (
          <div className={cn("mt-7 flex flex-wrap gap-3", centered && "justify-center")}>
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
