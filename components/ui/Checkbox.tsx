"use client";

import * as React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<
  React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root>,
  "asChild" | "size"
> {
  /** Label rendered next to the checkbox. */
  label?: React.ReactNode;
  /** `sm` pairs with dense admin rows; `md` is the default form size. */
  size?: "md" | "sm";
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof RadixCheckbox.Root>,
  CheckboxProps
>(function Checkbox({ className, label, id, size = "md", ...props }, ref) {
  const reactId = React.useId();
  const checkboxId = id ?? `checkbox-${reactId}`;
  const compact = size === "sm";

  const control = (
    <RadixCheckbox.Root
      ref={ref}
      id={checkboxId}
      className={cn(
        "bg-surface shrink-0 rounded-xs",
        compact ? "size-4" : "size-5",
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
        <Check className={compact ? "size-3" : "size-3.5"} strokeWidth={3} />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (!label) return control;

  return (
    <div className={cn("inline-flex gap-3", compact ? "items-center gap-2" : "items-start")}>
      {control}
      <label
        htmlFor={checkboxId}
        className={cn(
          "cursor-pointer leading-snug select-none",
          compact ? "label-sm text-ink-80" : "body-md text-ink-95",
        )}
      >
        {label}
      </label>
    </div>
  );
});
