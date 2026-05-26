"use client";

import { Check } from "lucide-react";
import { whatsAppHref } from "@/lib/whatsapp";

/**
 * Inline success block shown in place of a form after submission.
 * Used by all three lead forms per 06/07/08 specs.
 */
export function LeadFormSuccess({
  message = "Thanks — we'll be in touch within 24 hours.",
}: {
  message?: string;
}) {
  return (
    <div className="bg-success-bg text-success flex flex-col items-center gap-3 rounded-md p-6 text-center">
      <Check className="size-8" aria-hidden="true" />
      <div className="headline-sm">{message}</div>
      <a
        href={whatsAppHref("default")}
        target="_blank"
        rel="noopener noreferrer"
        className="label-lg text-ink-80 underline-offset-2 hover:underline"
      >
        Need to add something? Chat on WhatsApp →
      </a>
    </div>
  );
}
