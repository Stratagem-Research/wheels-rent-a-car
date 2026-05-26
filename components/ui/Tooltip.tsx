"use client";

import * as React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = RadixTooltip.Provider;
export const TooltipRoot = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof RadixTooltip.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>
>(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-[240px] rounded-sm px-2.5 py-1.5",
          "bg-ink-95 text-paper label-sm",
          className,
        )}
        {...props}
      />
    </RadixTooltip.Portal>
  );
});

/**
 * Convenience wrapper: `<Tooltip content="...">{trigger}</Tooltip>`.
 * For richer compositions, import {TooltipProvider, TooltipRoot, …} instead.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  delayDuration = 200,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{content}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
