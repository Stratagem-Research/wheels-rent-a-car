"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton loader — shimmer animation in ink-10 ↔ ink-20 (00_global.md §15).
 * Honours prefers-reduced-motion (set globally in globals.css).
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "bg-ink-10 block rounded-md",
        "animate-pulse motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
