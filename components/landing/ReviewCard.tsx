"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ReviewCard — landingpage.md §7 + TravelPerk feature-row treatment.
 *
 * Generous tinted card (~360-420px wide in the marquee) with stars at the
 * top, a multi-line body in body-md, and a reviewer + source line at the
 * bottom. Stars are monochrome ink-100 (NOT yellow — the brand rule: stars
 * sit on the spine, never decorative colour).
 *
 * Source chip (Google / Trustpilot) renders as a label-sm tint-pill so the
 * source attribution is visible without leaning on coloured logos.
 */

export interface ReviewCardProps {
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  reviewerName: string;
  date: string;
  source?: "google" | "trustpilot";
  className?: string;
}

const SOURCE_LABEL: Record<NonNullable<ReviewCardProps["source"]>, string> = {
  google: "Google",
  trustpilot: "Trustpilot",
};

export function ReviewCard({
  rating,
  body,
  reviewerName,
  date,
  source,
  className,
}: ReviewCardProps) {
  return (
    <article
      className={cn("bg-ink-10 rounded-xl", "flex h-full flex-col gap-5", "p-8 sm:p-10", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn("size-4", i < rating ? "fill-ink-100 text-ink-100" : "text-ink-30")}
              aria-hidden="true"
            />
          ))}
        </div>
        {source ? (
          <span className="label-sm rounded-pill bg-paper text-ink-80 inline-flex items-center px-3 py-1">
            {SOURCE_LABEL[source]}
          </span>
        ) : null}
      </div>

      <p className="body-lg text-ink-95 line-clamp-6 flex-1">{body}</p>

      <footer className="flex flex-col gap-0.5">
        <span className="label-md text-ink-95">{reviewerName}</span>
        <span className="label-sm text-ink-50">{date}</span>
      </footer>
    </article>
  );
}
