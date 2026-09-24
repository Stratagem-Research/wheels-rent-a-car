"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { type WhatsAppContext, type WhatsAppContextDetails } from "@/lib/whatsapp";
import { useWhatsAppHref } from "@/components/providers/ContactSettingsProvider";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Floating WhatsApp action button per 00_global.md §6.
 *
 * - Fixed bottom-right (desktop) / above safe-area on mobile.
 * - 56px circle, WhatsApp green, never restyled.
 * - Hidden on /book/checkout once the user has interacted with the form
 *   (Sprint 6 wires the interaction trigger; here we just hide on that path).
 * - Context-aware pre-filled message per route via WhatsAppContext.
 */

const HIDE_ON_PATHS = ["/book/checkout"];

function contextForPath(pathname: string): WhatsAppContext {
  if (pathname.startsWith("/book/select-vehicle")) return "select-vehicle";
  if (pathname.startsWith("/book/checkout")) return "checkout";
  if (pathname.startsWith("/book/confirmation")) return "confirmation";
  if (pathname.startsWith("/vehicles")) return "fleet";
  return "default";
}

export interface WhatsAppFabProps {
  /** Override the auto-detected context (e.g. PDP needs the model name). */
  context?: WhatsAppContext;
  /** Additional template details for the message. */
  details?: WhatsAppContextDetails;
}

export function WhatsAppFab({ context, details }: WhatsAppFabProps = {}) {
  const whatsAppHref = useWhatsAppHref();
  const pathname = usePathname();
  const ctx = context ?? contextForPath(pathname ?? "");

  if (HIDE_ON_PATHS.includes(pathname ?? "")) return null;

  return (
    <a
      href={whatsAppHref(ctx, details ?? {})}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onClick={() => track(EVENTS.WHATSAPP_CLICKED, { context: ctx, path: pathname ?? "" })}
      className={cn(
        "fixed z-40 inline-flex items-center justify-center",
        "text-paper size-14 rounded-full bg-[#25D366]",
        "shadow-[var(--shadow-photo)]",
        "hover:bg-[#1eb256] active:bg-[#1eb256]",
        "transition-colors duration-150 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]",
        "right-4 bottom-24 sm:right-6 sm:bottom-6",
      )}
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M19.07 4.93A10.05 10.05 0 0 0 12 2a10 10 0 0 0-8.59 15.07L2 22l5.07-1.33A10 10 0 1 0 19.07 4.93Zm-7.06 15.4a8.31 8.31 0 0 1-4.24-1.16l-.3-.18-3 .8.8-2.93-.2-.31a8.34 8.34 0 1 1 6.95 3.78Zm4.57-6.24c-.25-.13-1.47-.73-1.7-.81s-.4-.13-.56.13-.65.81-.79.97-.29.2-.54.07a6.81 6.81 0 0 1-2-1.24 7.57 7.57 0 0 1-1.4-1.74c-.14-.25 0-.38.11-.51s.25-.29.37-.43a1.66 1.66 0 0 0 .25-.42.46.46 0 0 0 0-.44c-.06-.13-.56-1.35-.76-1.85s-.4-.42-.56-.43h-.48a.92.92 0 0 0-.67.31 2.78 2.78 0 0 0-.87 2.08c0 1.23.9 2.41 1 2.58s1.74 2.65 4.21 3.72a13.42 13.42 0 0 0 1.4.52 3.36 3.36 0 0 0 1.55.1 2.55 2.55 0 0 0 1.67-1.18 2.07 2.07 0 0 0 .14-1.18c-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}
