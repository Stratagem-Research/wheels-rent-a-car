"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Badges per DESIGN.md §components.badge-*.
 * rounded-sm (4px) on purpose — flatter than chips so they read as
 * information rather than affordances. Inline-flex so they sit nicely
 * next to text or inside cards.
 */
const badgeVariants = cva(
  cn("inline-flex items-center gap-1 rounded-sm px-2 py-0.5", "label-sm uppercase tracking-wider"),
  {
    variants: {
      variant: {
        bestDeal: "bg-signal-red text-paper",
        popular: "bg-ink-100 text-paper",
        new: "bg-success-bg text-success",
        pending: "bg-warning-bg text-warning",
        info: "bg-info-bg text-info",
        neutral: "bg-ink-20 text-ink-80",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
