"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

/*
 * Toast — INK & SIGNAL primitive (DESIGN.md §components.toast).
 *
 *   info    (default) ink-100 / paper, body-sm, rounded.lg, 14×18 padding,
 *                     auto-dismiss 4s
 *   success           success / paper, auto-dismiss 3s
 *   warning           warning / paper, manual dismiss
 *   error             signal-red / paper, manual dismiss
 *
 * Per 00_global.md §8:
 *   - Desktop: bottom-right, 24px from edges
 *   - Mobile:  top, with safe-area inset
 *   - Max 3 visible; newer pushes older up
 */

export function ToastProvider() {
  return (
    <SonnerToaster
      position="bottom-right"
      visibleToasts={3}
      gap={8}
      closeButton
      richColors={false}
      offset={24}
      mobileOffset={16}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "body-sm rounded-lg px-[18px] py-[14px] max-w-[360px] shadow-[var(--shadow-elevation-3)]",
          default: "bg-ink-100 text-paper border-0",
          info: "bg-ink-100 text-paper border-0",
          success: "bg-[var(--color-success)] text-paper border-0",
          warning: "bg-[var(--color-warning)] text-paper border-0",
          error: "bg-signal-red text-paper border-0",
          title: "headline-xs",
          description: "body-sm opacity-90 mt-1",
          closeButton:
            "!bg-transparent !border-0 !text-[color:inherit] hover:!opacity-80 focus-visible:!outline-2 focus-visible:!outline-current",
        },
      }}
    />
  );
}

/** Imperative toast API — wraps sonner's `toast` for type safety + duration defaults. */
export const toast = {
  info: (message: React.ReactNode, opts?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast(message, { duration: 4000, ...opts }),
  success: (message: React.ReactNode, opts?: Parameters<typeof sonnerToast.success>[1]) =>
    sonnerToast.success(message, { duration: 3000, ...opts }),
  warning: (message: React.ReactNode, opts?: Parameters<typeof sonnerToast.warning>[1]) =>
    sonnerToast.warning(message, { duration: Infinity, ...opts }),
  error: (message: React.ReactNode, opts?: Parameters<typeof sonnerToast.error>[1]) =>
    sonnerToast.error(message, { duration: Infinity, ...opts }),
  dismiss: sonnerToast.dismiss,
};
