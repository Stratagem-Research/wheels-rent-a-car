"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Native <select>. Same dimensions as Input. For richer custom dropdowns
 * (search, multi, virtualization) we'll layer a Radix Popover later — but
 * for most form fields the native control is faster and more accessible.
 */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, disabled, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "bg-surface relative flex h-13 items-center rounded-md",
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
          "h-full w-full appearance-none bg-transparent pr-10 pl-4",
          "body-md text-ink-95 outline-none",
          "disabled:text-ink-50 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-ink-60 pointer-events-none absolute right-4 size-4"
      />
    </div>
  );
});
