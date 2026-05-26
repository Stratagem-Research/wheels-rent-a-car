"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dismissible promo strip per 01_home.md §1.
 *
 * - 40px tall, ink-100 background, paper text.
 * - Remembers dismissal in localStorage for 7 days under `wheels.promo.dismissed`.
 * - Renders nothing if there's no active campaign (server-decided via props).
 */

const STORAGE_KEY = "wheels.promo.dismissed";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface PromoStripProps {
  message: string;
  href?: string;
  /** Unique key for the campaign; new campaigns reset dismissal. */
  campaignKey?: string;
}

export function PromoStrip({ message, href, campaignKey = "default" }: PromoStripProps) {
  const [hidden, setHidden] = React.useState(true);

  // Hydration-safe pattern: start hidden so SSR renders nothing, then reveal
  // on mount if dismissal hasn't been persisted. The setState calls bridge
  // SSR with localStorage on first paint — intentional, not a render loop.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHidden(false);
        return;
      }
      const parsed = JSON.parse(raw) as { key: string; ts: number };
      const expired = Date.now() - parsed.ts > DISMISS_TTL_MS;
      if (parsed.key !== campaignKey || expired) {
        setHidden(false);
      }
    } catch {
      setHidden(false);
    }
  }, [campaignKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (hidden) return null;

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ key: campaignKey, ts: Date.now() }),
      );
    } catch {
      // ignore
    }
    setHidden(true);
  };

  return (
    <div
      role="region"
      aria-label="Promotional banner"
      className={cn(
        "relative flex items-center justify-center gap-3 px-5 py-2.5",
        "bg-ink-100 text-paper label-lg",
        "min-h-10",
      )}
    >
      <span className="text-center">
        {href ? (
          <Link href={href} className="underline underline-offset-2 hover:no-underline">
            {message}
          </Link>
        ) : (
          message
        )}
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss promo banner"
        className={cn(
          "absolute right-2 inline-flex size-8 items-center justify-center rounded-full",
          "text-paper/80 hover:text-paper hover:bg-white/10",
          "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
        )}
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
