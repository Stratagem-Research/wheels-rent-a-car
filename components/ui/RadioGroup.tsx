"use client";

import * as React from "react";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadixRadioGroup.Root>,
  React.ComponentPropsWithoutRef<typeof RadixRadioGroup.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return (
    <RadixRadioGroup.Root ref={ref} className={cn("flex flex-col gap-3", className)} {...props} />
  );
});

export interface RadioItemProps extends Omit<
  React.ComponentPropsWithoutRef<typeof RadixRadioGroup.Item>,
  "asChild"
> {
  label?: React.ReactNode;
}

export const RadioItem = React.forwardRef<
  React.ElementRef<typeof RadixRadioGroup.Item>,
  RadioItemProps
>(function RadioItem({ className, label, id, ...props }, ref) {
  const reactId = React.useId();
  const radioId = id ?? `radio-${reactId}`;

  const control = (
    <RadixRadioGroup.Item
      ref={ref}
      id={radioId}
      className={cn(
        "bg-surface size-5 shrink-0 rounded-full",
        "border-border-strong border-[1.5px]",
        "transition-colors duration-150 ease-out",
        "data-[state=checked]:border-ink-100",
        "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:shadow-[0_0_0_4px_var(--color-signal-blue-bg)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <RadixRadioGroup.Indicator
        className={cn(
          "flex h-full w-full items-center justify-center",
          "after:bg-ink-100 after:block after:size-2.5 after:rounded-full",
        )}
      />
    </RadixRadioGroup.Item>
  );

  if (!label) return control;

  return (
    <div className="inline-flex items-start gap-3">
      {control}
      <label
        htmlFor={radioId}
        className="body-md text-ink-95 cursor-pointer leading-snug select-none"
      >
        {label}
      </label>
    </div>
  );
});
