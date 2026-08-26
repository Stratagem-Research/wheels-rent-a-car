"use client";

import * as React from "react";
import * as RadixAccordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = RadixAccordion.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof RadixAccordion.Item>,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <RadixAccordion.Item
      ref={ref}
      className={cn("border-border border-b last:border-b-0", className)}
      {...props}
    />
  );
});

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof RadixAccordion.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Trigger> & { hideChevron?: boolean }
>(function AccordionTrigger({ className, children, hideChevron, ...props }, ref) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        ref={ref}
        className={cn(
          "group flex flex-1 items-center justify-between gap-3 py-5 text-left",
          "headline-xs text-ink-95",
          "hover:text-ink-80 transition-colors duration-150",
          "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
          className,
        )}
        {...props}
      >
        {children}
        {hideChevron ? null : (
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "text-ink-60 size-5 shrink-0 transition-transform duration-200",
              "group-data-[state=open]:text-ink-100 group-data-[state=open]:rotate-180",
            )}
          />
        )}
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
});

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof RadixAccordion.Content>,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <RadixAccordion.Content
      ref={ref}
      className={cn(
        "body-md text-ink-80 overflow-hidden",
        "data-[state=open]:animate-[wheels-accordion-down_200ms_ease-out]",
        "data-[state=closed]:animate-[wheels-accordion-up_180ms_ease-out]",
      )}
      {...props}
    >
      <div className={cn("pt-1 pr-8 pb-5", className)}>{children}</div>
    </RadixAccordion.Content>
  );
});
