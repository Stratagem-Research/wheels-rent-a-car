"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Chip — INK & SIGNAL primitive (DESIGN.md §components.chip).
 *
 * Variants:
 *   default            ink-10 fill, ink-80 text (light surface filter chip).
 *   selected           ink-100 fill, paper text (light surface, on).
 *   inverse            ink-80 fill, paper text (dark surface, off).
 *   inverse-selected   paper fill, ink-100 text (dark surface, on).
 *
 * 36px tall, label-md typography, pill rounded. Used by HeroSearchTabs,
 * filter chip rows, and quick selectors throughout.
 */
const chipVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-pill select-none",
    "label-md whitespace-nowrap",
    "transition-colors duration-150 ease-out cursor-pointer",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-60",
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-ink-10 text-ink-80",
          "hover:bg-ink-15 hover:text-ink-95",
          "focus-visible:outline-ink-100",
          "focus-visible:shadow-[0_0_0_4px_var(--color-ink-10)]",
        ),
        selected: cn(
          "bg-ink-100 text-paper",
          "hover:bg-ink-80",
          "focus-visible:outline-ink-100",
          "focus-visible:shadow-[0_0_0_4px_var(--color-ink-10)]",
        ),
        inverse: cn(
          "bg-ink-80 text-paper",
          "hover:bg-ink-70",
          "focus-visible:outline-paper",
          "focus-visible:shadow-[0_0_0_4px_rgba(255,255,255,0.16)]",
        ),
        "inverse-selected": cn(
          "bg-paper text-ink-100",
          "hover:bg-ink-15",
          "focus-visible:outline-paper",
          "focus-visible:shadow-[0_0_0_4px_rgba(255,255,255,0.16)]",
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof chipVariants> {}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, variant, type, ...props },
  ref,
) {
  const isOn = variant === "selected" || variant === "inverse-selected";
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      data-state={isOn ? "on" : "off"}
      aria-pressed={isOn}
      className={cn(chipVariants({ variant }), className)}
      {...props}
    />
  );
});

export { chipVariants };
