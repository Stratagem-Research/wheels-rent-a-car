"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuantityStepperProps {
  value: number;
  onValueChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Accessible label, e.g. "Number of baby seats". */
  "aria-label": string;
  className?: string;
}

/**
 * Quantity stepper for booking add-ons (baby seats, drivers, etc. in
 * 04_booking_flow.md step 2). Triple-target: − button, numeric readout, + button.
 */
export const QuantityStepper = React.forwardRef<HTMLDivElement, QuantityStepperProps>(
  function QuantityStepper(
    { value, onValueChange, min = 0, max = 99, step = 1, disabled, className, ...props },
    ref,
  ) {
    const dec = () => onValueChange(Math.max(min, value - step));
    const inc = () => onValueChange(Math.min(max, value + step));

    const decDisabled = disabled || value <= min;
    const incDisabled = disabled || value >= max;

    return (
      <div
        ref={ref}
        role="group"
        aria-label={props["aria-label"]}
        className={cn("inline-flex items-center gap-2", disabled && "opacity-60", className)}
      >
        <button
          type="button"
          onClick={dec}
          disabled={decDisabled}
          aria-label="Decrease"
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full",
            "border-border-strong bg-surface text-ink-80 border",
            "hover:bg-ink-10 active:bg-ink-20",
            "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
            "disabled:bg-ink-10 disabled:text-ink-50 disabled:cursor-not-allowed",
          )}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          aria-atomic="true"
          className="headline-xs text-ink-95 min-w-[2ch] text-center tabular-nums"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={incDisabled}
          aria-label="Increase"
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full",
            "border-border-strong bg-surface text-ink-80 border",
            "hover:bg-ink-10 active:bg-ink-20",
            "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
            "disabled:bg-ink-10 disabled:text-ink-50 disabled:cursor-not-allowed",
          )}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  },
);
