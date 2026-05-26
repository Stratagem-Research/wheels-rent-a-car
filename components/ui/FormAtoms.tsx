"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * Form atoms — Label, HelperText, ErrorText, and a Field wrapper that
 * orchestrates ARIA wiring (id, aria-describedby, aria-invalid).
 *
 * Per 00_global.md §9:
 * - Label above the field, label-md, ink-70. Required fields have a `*` in error red.
 * - Helper text below field, label-sm, ink-50.
 * - Error text replaces helper text when present; same size, color error.
 * - 8px between label and field, 6px between field and helper/error, 20px between fields.
 */

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, required, children, ...props },
  ref,
) {
  return (
    <label ref={ref} className={cn("label-md text-ink-70 block", className)} {...props}>
      {children}
      {required ? (
        <span className="text-signal-red ml-0.5" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
});

export const HelperText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function HelperText({ className, ...props }, ref) {
  return <p ref={ref} className={cn("label-sm text-ink-50", className)} {...props} />;
});

export const ErrorText = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function ErrorText({ className, ...props }, ref) {
  return <p ref={ref} role="alert" className={cn("label-sm text-error", className)} {...props} />;
});

type FieldRenderProps = {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
};

export interface FieldProps {
  /** Field label shown above the control. */
  label: string;
  /** Helper text shown below; hidden when an error is active. */
  helper?: React.ReactNode;
  /** Error message; replaces helper text and sets aria-invalid. */
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  /** Custom id; auto-generated otherwise. */
  id?: string;
  /** Render-prop: receives ARIA ids and invalid flag to wire onto the control. */
  children: (props: FieldRenderProps) => React.ReactNode;
}

/**
 * Field wires a label, helper, error, and a single input together with the
 * correct ARIA attributes. The render-prop hands ids and the invalid flag to
 * the control — components like <Input /> read them to set aria-describedby /
 * aria-invalid without you remembering to.
 */
export function Field({
  label,
  helper,
  error,
  required,
  className,
  id: idProp,
  children,
}: FieldProps) {
  const reactId = React.useId();
  const id = idProp ?? `field-${reactId}`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : helper ? helperId : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <ErrorText id={errorId}>{error}</ErrorText>
      ) : helper ? (
        <HelperText id={helperId}>{helper}</HelperText>
      ) : null}
    </div>
  );
}
