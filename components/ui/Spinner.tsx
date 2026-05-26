"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** Accessible label; defaults to "Loading". */
  label?: string;
  size?: "sm" | "md" | "lg";
}

/** Inline spinner. 24px default per 00_global.md §15. */
export function Spinner({ className, label = "Loading", size = "md", ...props }: SpinnerProps) {
  const dim = size === "sm" ? "size-4" : size === "lg" ? "size-8" : "size-6";
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn("animate-spin motion-reduce:animate-none", dim, className)}
      {...props}
    />
  );
}
