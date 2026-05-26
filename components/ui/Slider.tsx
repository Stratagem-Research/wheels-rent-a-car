"use client";

import * as React from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * Range slider — used for the price filter on fleet browse (02_fleet_browse.md §4).
 * Supports single value or [min, max] dual-handle.
 */
export const Slider = React.forwardRef<
  React.ElementRef<typeof RadixSlider.Root>,
  React.ComponentPropsWithoutRef<typeof RadixSlider.Root>
>(function Slider({ className, value, defaultValue, ...props }, ref) {
  const thumbCount = (value ?? defaultValue)?.length ?? 1;

  return (
    <RadixSlider.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        "data-[disabled]:opacity-60",
        className,
      )}
      {...props}
    >
      <RadixSlider.Track className="bg-ink-20 relative h-1.5 grow rounded-full">
        <RadixSlider.Range className="bg-ink-95 absolute h-full rounded-full" />
      </RadixSlider.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <RadixSlider.Thumb
          key={i}
          className={cn(
            "bg-surface border-ink-95 block size-5 rounded-full border-2",
            "shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
            "transition-shadow duration-150 ease-out",
            "hover:shadow-[0_2px_6px_rgba(0,0,0,0.2)]",
            "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
            "focus-visible:shadow-[0_0_0_4px_var(--color-signal-blue-bg)]",
          )}
        />
      ))}
    </RadixSlider.Root>
  );
});
