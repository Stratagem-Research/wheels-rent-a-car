"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "bg-surface block w-full rounded-md px-4 py-3",
        "body-md text-ink-95",
        "border transition-colors duration-150 ease-out",
        "placeholder:text-ink-50 min-h-[120px] resize-y",
        "focus:outline-ink-100 focus:outline-2 focus:outline-offset-0",
        "focus:shadow-[0_0_0_4px_var(--color-signal-blue-bg)]",
        invalid ? "border-error border-[1.5px]" : "border-border focus:border-ink-100 border",
        "disabled:bg-ink-10 disabled:text-ink-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
});
