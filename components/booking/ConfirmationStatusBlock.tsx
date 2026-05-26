"use client";

import * as React from "react";
import { Check, Clock, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import type { BookingState } from "@/types/domain";

/**
 * Confirmation status hero per 04_booking_flow.md step 5.
 *
 *   confirmed → green check + "Your booking is confirmed"
 *   pending   → amber clock + "Your booking is pending"
 *
 * Booking ref renders in JetBrains Mono with a copy-to-clipboard button.
 */

export interface ConfirmationStatusBlockProps {
  state: BookingState;
  bookingRef: string;
}

export function ConfirmationStatusBlock({ state, bookingRef }: ConfirmationStatusBlockProps) {
  const isPending = state === "pending";

  return (
    <section
      aria-labelledby="confirmation-headline"
      className="flex flex-col items-center gap-3 px-5 pt-12 text-center sm:pt-16"
    >
      <div
        aria-hidden="true"
        className={cn(
          "inline-flex size-12 items-center justify-center rounded-full",
          isPending ? "bg-warning-bg text-warning" : "bg-success-bg text-success",
        )}
      >
        {isPending ? <Clock className="size-6" /> : <Check className="size-6" />}
      </div>
      <h1
        id="confirmation-headline"
        className={cn("headline-xl", isPending ? "text-warning" : "text-ink-95")}
      >
        {isPending ? "Your booking is pending" : "Your booking is confirmed"}
      </h1>
      <div className="flex flex-col items-center gap-1">
        <span className="label-md text-ink-50 tracking-wider uppercase">Reference</span>
        <CopyableRef value={bookingRef} />
      </div>
      {isPending ? (
        <p className="body-md text-ink-60 max-w-md">
          We&apos;ll confirm your booking within 24 hours of receiving payment and let you know on
          WhatsApp.
        </p>
      ) : null}
    </section>
  );
}

function CopyableRef({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Reference copied");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — please copy manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Copy booking reference ${value}`}
      className={cn(
        "mono-lg text-ink-95 inline-flex items-center gap-2 rounded-md px-3 py-1.5",
        "hover:bg-ink-10 transition-colors",
        "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
      )}
    >
      {value}
      {copied ? (
        <Check className="text-success size-4" aria-hidden="true" />
      ) : (
        <Copy className="text-ink-60 size-4" aria-hidden="true" />
      )}
    </button>
  );
}
