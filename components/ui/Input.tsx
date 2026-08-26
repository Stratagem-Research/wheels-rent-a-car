"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * Input — INK & SIGNAL primitive (DESIGN.md §components.input + §search-input).
 *
 * Variants:
 *   default  56px tall, rounded.lg (16px), 1px border, paper surface.
 *   search   64px tall, pill-rounded, body-lg type — for the hero search bar
 *            and any field that needs to read as a "search affordance".
 *   inverse  paper text on ink-90 (used inside dark sections).
 */

const wrapperVariants = cva(
  cn(
    "flex items-center gap-2 w-full",
    "border transition-colors duration-150 ease-out",
    "focus-within:outline-2 focus-within:outline-ink-100 focus-within:outline-offset-0",
    "focus-within:shadow-[0_0_0_4px_var(--color-ink-10)]",
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-paper rounded-lg h-10 px-[15px] body-md text-ink-95",
          "focus-within:border-ink-100",
        ),
        search: cn(
          "bg-paper rounded-pill h-12 px-5 body-lg text-ink-95",
          "focus-within:border-ink-100",
        ),
        inverse: cn(
          "bg-ink-90 rounded-lg h-12 px-[16px] body-md text-paper",
          "focus-within:border-paper",
          "focus-within:outline-paper",
          "focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.16)]",
        ),
      },
      state: {
        normal: "border-border",
        invalid: "border-[1.5px] border-error",
        disabled: "bg-ink-10 text-ink-50 cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "normal",
    },
  },
);

type InputVariant = VariantProps<typeof wrapperVariants>["variant"];

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders the input in an error state (red border) and forwards aria-invalid. */
  invalid?: boolean;
  /** Optional left-aligned content (e.g. icon, prefix). */
  startAdornment?: React.ReactNode;
  /** Optional right-aligned content (e.g. clear button, suffix). */
  endAdornment?: React.ReactNode;
  /** Surface treatment — defaults to `default` (56px, rounded-lg). */
  variant?: InputVariant;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, variant, invalid, startAdornment, endAdornment, disabled, ...props },
  ref,
) {
  const state = disabled ? "disabled" : invalid ? "invalid" : "normal";
  const inverse = variant === "inverse";
  return (
    <div className={cn(wrapperVariants({ variant, state }), className)}>
      {startAdornment ? (
        <span
          className={cn("flex items-center", inverse ? "text-ink-40" : "text-ink-60")}
          aria-hidden="true"
        >
          {startAdornment}
        </span>
      ) : null}
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex-1 bg-transparent outline-none",
          inverse ? "placeholder:text-ink-40" : "placeholder:text-ink-50",
          "disabled:cursor-not-allowed",
        )}
        {...props}
      />
      {endAdornment ? (
        <span className={cn("flex items-center", inverse ? "text-ink-40" : "text-ink-60")}>
          {endAdornment}
        </span>
      ) : null}
    </div>
  );
});

export { wrapperVariants as inputWrapperVariants };
