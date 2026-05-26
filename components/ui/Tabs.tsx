"use client";

import * as React from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/*
 * Tabs per DESIGN.md §components.tab and 03_vehicle_detail.md §3.
 * Text-only triggers with a 2px bottom underline on the active tab.
 * Keyboard nav (←/→/Home/End) comes from Radix.
 */

export const Tabs = RadixTabs.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof RadixTabs.List>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <RadixTabs.List
      ref={ref}
      className={cn("border-border flex items-center gap-2 overflow-x-auto border-b", className)}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof RadixTabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <RadixTabs.Trigger
      ref={ref}
      className={cn(
        "headline-xs text-ink-60 relative px-4 py-3 whitespace-nowrap",
        "transition-colors duration-150",
        "hover:text-ink-80",
        "data-[state=active]:text-ink-100",
        "data-[state=active]:after:absolute data-[state=active]:after:right-0 data-[state=active]:after:left-0",
        "data-[state=active]:after:bottom-[-1px] data-[state=active]:after:h-[2px]",
        "data-[state=active]:after:bg-ink-100",
        "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof RadixTabs.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <RadixTabs.Content
      ref={ref}
      className={cn(
        "focus-visible:outline-ink-100 mt-6 focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    />
  );
});
