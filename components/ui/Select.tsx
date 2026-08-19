"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Native <select>. Same dimensions as Input. For richer custom dropdowns
 * (search, multi, virtualization) we'll layer a Radix Popover later — but
 * for most form fields the native control is faster and more accessible.
 */

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  invalid?: boolean;
  size?: "md" | "sm";
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, disabled, size = "md", ...props },
  ref,
) {
  const compact = size === "sm";
  return (
    <div
      className={cn(
        "bg-surface relative flex items-center rounded-md",
        compact ? "h-9" : "h-13",
        "border transition-colors duration-150 ease-out",
        "focus-within:outline-ink-100 focus-within:outline-2 focus-within:outline-offset-0",
        "focus-within:shadow-[0_0_0_4px_var(--color-signal-blue-bg)]",
        invalid
          ? "border-error border-[1.5px]"
          : "border-border focus-within:border-ink-100 border",
        disabled && "bg-ink-10 cursor-not-allowed",
      )}
    >
      <select
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-full w-full appearance-none bg-transparent outline-none",
          compact ? "label-md pr-8 pl-3" : "body-md pr-10 pl-4",
          "text-ink-95",
          "disabled:text-ink-50 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "text-ink-60 pointer-events-none absolute size-4",
          compact ? "right-2.5" : "right-4",
        )}
      />
    </div>
  );
});
