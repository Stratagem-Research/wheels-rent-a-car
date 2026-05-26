"use client";

import * as React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<
  React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root>,
  "asChild"
> {
  /** Label rendered next to the checkbox. */
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof RadixCheckbox.Root>,
  CheckboxProps
>(function Checkbox({ className, label, id, ...props }, ref) {
  const reactId = React.useId();
  const checkboxId = id ?? `checkbox-${reactId}`;

  const control = (
    <RadixCheckbox.Root
      ref={ref}
      id={checkboxId}
      className={cn(
        "bg-surface size-5 shrink-0 rounded-xs",
        "border-border-strong border-[1.5px]",
        "transition-colors duration-150 ease-out",
        "data-[state=checked]:bg-ink-95 data-[state=checked]:border-ink-95",
        "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:shadow-[0_0_0_4px_var(--color-signal-blue-bg)]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator className="text-paper flex items-center justify-center">
        <Check className="size-3.5" strokeWidth={3} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (!label) return control;

  return (
    <div className="inline-flex items-start gap-3">
      {control}
      <label
        htmlFor={checkboxId}
        className="body-md text-ink-95 cursor-pointer leading-snug select-none"
      >
        {label}
      </label>
    </div>
  );
});
