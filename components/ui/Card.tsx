"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Card — INK & SIGNAL primitive (DESIGN.md §components.card).
 *
 * Depth comes from contrast and tonal layers, not blur. The ONLY default-
 * shadowed card is `floating` (used for the search bar and the sticky
 * booking summary). Hover-lift via elevation-1 is opt-in via `hoverable`.
 *
 * Variants:
 *   default    paper + 1px border, no shadow, rounded.xl (20px).
 *   tint       ink-10, no border, no shadow.
 *   inverse    ink-100 surface, paper text, 32px padding.
 *   image      ink-95 surface, 0 padding (image bleeds inside the radius).
 *   floating   paper + elevation-3, rounded.2xl — the ONLY default-shadowed card.
 *
 * Legacy aliases kept for back-compat (Phase 4 renamed the option list):
 *   `elevated` and `outline` map to `default`. `muted` maps to `tint`.
 */
const cardVariants = cva("transition-colors duration-150 ease-out", {
  variants: {
    variant: {
      default: "bg-paper rounded-xl border border-border p-6",
      tint: "bg-ink-10 rounded-xl p-6",
      inverse: "bg-ink-100 text-paper rounded-xl p-8",
      image: "bg-ink-95 rounded-xl overflow-hidden",
      floating: "bg-paper rounded-2xl p-6 shadow-[var(--shadow-elevation-3)]",

      // Legacy aliases (Phase 1 / 2 naming). Treat as `default` / `tint`.
      elevated: "bg-paper rounded-xl border border-border p-6",
      outline: "bg-paper rounded-xl border border-border p-6",
      muted: "bg-ink-10 rounded-xl p-6",
    },
    hoverable: {
      true: "hover:shadow-[var(--shadow-elevation-1)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, hoverable, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn(cardVariants({ variant, hoverable }), className)} {...props} />
  );
});

export { cardVariants };
