"use client";

import * as React from "react";
import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<
  React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>,
  "asChild"
> {
  label?: React.ReactNode;
}

export const Switch = React.forwardRef<React.ElementRef<typeof RadixSwitch.Root>, SwitchProps>(
  function Switch({ className, label, id, ...props }, ref) {
    const reactId = React.useId();
    const switchId = id ?? `switch-${reactId}`;

    const control = (
      <RadixSwitch.Root
        ref={ref}
        id={switchId}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
          "bg-ink-30 transition-colors duration-150 ease-out",
          "data-[state=checked]:bg-ink-95",
          "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:shadow-[0_0_0_4px_var(--color-signal-blue-bg)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      >
        <RadixSwitch.Thumb
          className={cn(
            "bg-surface pointer-events-none block size-5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.15)]",
            "translate-x-0.5 transition-transform duration-150 ease-out",
            "data-[state=checked]:translate-x-[1.375rem]",
          )}
        />
      </RadixSwitch.Root>
    );

    if (!label) return control;

    return (
      <div className="inline-flex items-center gap-3">
        {control}
        <label htmlFor={switchId} className="body-md text-ink-95 cursor-pointer select-none">
          {label}
        </label>
      </div>
    );
  },
);
