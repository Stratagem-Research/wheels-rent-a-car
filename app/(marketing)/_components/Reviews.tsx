"use client";

import * as React from "react";
import { ReviewCard } from "@/components/landing/ReviewCard";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/domain";

/**
 * Reviews — landingpage.md §7 + TravelPerk feature-row pattern.
 *
 * Infinite horizontal marquee of review cards that auto-scrolls right →
 * left at ~constant velocity. Hovering anywhere on the track pauses the
 * animation; leaving the hover resumes it. Loop seam is invisible because
 * the track contains the review list rendered TWICE back-to-back, so the
 * -50% transform lands at a frame visually identical to the start.
 *
 * Reduced-motion: the global @media query in app/globals.css collapses
 * animation-duration to ~0, which would skip the marquee to its end frame.
 * Without explicit handling that would leave the track translated -50%.
 * The component sets `aria-live="off"` and the marquee is purely decorative
 * — the same review list is still readable in DOM order for assistive tech.
 *
 * Reads all reviews (not just three) so the marquee has enough content to
 * loop visibly. Section hides silently if the list is empty.
 */
export function Reviews({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  // Speed: ~30s per full loop for a list of ~6. Scales linearly with count
  // so adding more reviews doesn't make the scroll feel faster.
  const duration = `${Math.max(20, reviews.length * 6)}s`;

  return (
    <section className="bg-paper">
      {/* Title block — tighter vertical rhythm: more breathing room above
       * the section but a closer pull-down to the reviews so the eye flows
       * from headline into cards without the empty 128-px gulf that the
       * py-32 used to create. */}
      <div className="mx-auto max-w-[var(--container-default)] px-5 pt-16 pb-8 sm:px-10 lg:pt-24 lg:pb-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="text-ink-60 overline">★ 5 on Google · 1,200+ reviews</p>
          <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
            Trusted by the people we drive.
          </h2>
        </div>
      </div>

      {/* Marquee — full-bleed so the cards run edge-to-edge and the eye reads
       * "endless scroll". The `group` + `group-hover:[animation-play-state:paused]`
       * pair lets a hover anywhere on the track freeze the animation. Mask
       * gradient on the left/right edges softens where new cards appear and
       * old cards disappear. Bottom padding wraps the section so the next
       * section doesn't kiss the cards. */}
      <div
        className={cn(
          "group relative overflow-hidden pb-16 lg:pb-24",
          "[mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]",
        )}
        aria-label="Customer reviews carousel"
      >
        <ul
          style={{ animationDuration: duration }}
          className={cn(
            "flex w-max gap-6 pb-2",
            "[animation-name:wheels-marquee] [animation-timing-function:linear] [animation-iteration-count:infinite]",
            "group-hover:[animation-play-state:paused]",
          )}
        >
          {/* Render the list TWICE so the loop seam at -50% is invisible. */}
          {[...reviews, ...reviews].map((r, i) => (
            <li
              key={`${r.id}-${i}`}
              aria-hidden={i >= reviews.length || undefined}
              className="w-[300px] shrink-0 sm:w-[360px] lg:w-[400px]"
            >
              <ReviewCard
                rating={Math.max(1, Math.min(5, r.rating)) as 1 | 2 | 3 | 4 | 5}
                body={r.body}
                reviewerName={r.author}
                date={r.date}
                source={r.source as "google" | "trustpilot" | undefined}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
