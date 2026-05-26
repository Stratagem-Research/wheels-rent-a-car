"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Modal — INK & SIGNAL primitive (DESIGN.md §components.modal).
 *
 * Largest curves in the system: rounded.3xl (32px). Paper surface,
 * elevation-4, 32px padding. Backdrop rgba(0,0,0,0.72) — heavy black,
 * on-brand. Sizes per 00_global.md §7: sm 560 / md 720 / lg 960.
 *
 * Mobile bottom-sheet variant lives in <Sheet />.
 */

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;
export const ModalPortal = Dialog.Portal;

type ContentSize = "sm" | "md" | "lg";

const sizeClass: Record<ContentSize, string> = {
  sm: "max-w-[560px]",
  md: "max-w-[720px]",
  lg: "max-w-[960px]",
};

export interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof Dialog.Content> {
  size?: ContentSize;
  /** Hide the default close (X) button. */
  hideCloseButton?: boolean;
}

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  ModalContentProps
>(function ModalContent({ className, children, size = "md", hideCloseButton, ...props }, ref) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-[rgba(0,0,0,0.72)]",
          "transition-opacity duration-200 ease-out",
          "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        )}
      />
      <Dialog.Content
        ref={ref}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
          sizeClass[size],
          "bg-paper rounded-3xl p-8 shadow-[var(--shadow-elevation-4)]",
          "transition-all duration-200 ease-out",
          "data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
          "data-[state=open]:scale-100 data-[state=open]:opacity-100",
          "focus:outline-none",
          className,
        )}
        {...props}
      >
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

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(function ModalTitle({ className, ...props }, ref) {
  return <Dialog.Title ref={ref} className={cn("headline-md text-ink-95", className)} {...props} />;
});

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(function ModalDescription({ className, ...props }, ref) {
  return (
    <Dialog.Description
      ref={ref}
      className={cn("body-md text-ink-60 mt-3", className)}
      {...props}
    />
  );
});

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
