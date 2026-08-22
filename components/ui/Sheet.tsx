"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Sheet — INK & SIGNAL primitive. Mobile-first bottom sheet variant of the
 * modal pattern (DESIGN.md §components.modal, 00_global.md §7).
 *
 * Bottom: full-width, top corners rounded.3xl (32px). Right/left: drawer
 * variant for desktop filter panels — top + outer corners rounded.3xl.
 * Backdrop matches Modal: rgba(0,0,0,0.72). Elevation-4.
 */

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

type Side = "bottom" | "right" | "left";

const sideClass: Record<Side, string> = {
  bottom: cn(
    "inset-x-0 bottom-0 max-h-[90vh] w-full",
    "rounded-t-3xl rounded-b-none",
    "data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
  ),
  right: cn(
    "right-0 top-0 h-full w-[min(440px,92vw)]",
    "rounded-l-3xl rounded-r-none",
    "data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
  ),
  left: cn(
    "left-0 top-0 h-full w-[min(440px,92vw)]",
    "rounded-r-3xl rounded-l-none",
    "data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
  ),
};

export interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof Dialog.Content> {
  side?: Side;
  hideCloseButton?: boolean;
}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  SheetContentProps
>(function SheetContent({ className, children, side = "bottom", hideCloseButton, ...props }, ref) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-[rgba(0,0,0,0.72)]",
          "transition-opacity duration-300 ease-out",
          "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        )}
      />
      <Dialog.Content
        ref={ref}
        className={cn(
          "bg-paper fixed z-50 p-8 shadow-(--shadow-elevation-4)",
          "transition-transform duration-300 ease-out",
          "focus:outline-none",
          sideClass[side],
          className,
        )}
        {...props}
      >
        {side === "bottom" ? (
          <div aria-hidden="true" className="bg-ink-20 mx-auto mb-5 h-1 w-12 rounded-full" />
        ) : null}
        {children}
        {hideCloseButton ? null : (
          <Dialog.Close
            aria-label="Close"
            className={cn(
              "rounded-pill absolute top-5 right-5 inline-flex size-11 items-center justify-center",
              "text-ink-60 hover:bg-ink-10 hover:text-ink-95",
              "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            <X className="size-5" aria-hidden="true" />
          </Dialog.Close>
        )}
      </Dialog.Content>
    </Dialog.Portal>
  );
});

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(function SheetTitle({ className, ...props }, ref) {
  return <Dialog.Title ref={ref} className={cn("headline-md text-ink-95", className)} {...props} />;
});

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(function SheetDescription({ className, ...props }, ref) {
  return (
    <Dialog.Description
      ref={ref}
      className={cn("body-md text-ink-60 mt-3", className)}
      {...props}
    />
  );
});
