"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * 24-minute booking-hold countdown per 04_booking_flow.md step 4.
 *
 * Counts down from `holdSeconds` (default 24 * 60 = 1440) to 0.
 * Fires `onExpire` once when it crosses zero; the parent uses that
 * to recompute pricing or surface a "Prices have changed" modal.
 *
 * Persists across remounts via sessionStorage `wheels.booking.holdUntil`
 * so refreshing checkout doesn't reset the timer.
 */

const HOLD_KEY = "wheels.booking.holdUntil";

export interface HoldTimerProps {
  holdSeconds?: number;
  onExpire?: () => void;
  className?: string;
}

export function HoldTimer({ holdSeconds = 24 * 60, onExpire, className }: HoldTimerProps) {
  const t = useTranslations("bookingFlow.hold");
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const firedExpire = React.useRef(false);

  React.useEffect(() => {
    let holdUntil: number;
    try {
      const stored = window.sessionStorage.getItem(HOLD_KEY);
      const parsed = stored ? Number(stored) : NaN;
      if (Number.isFinite(parsed) && parsed > Date.now()) {
        holdUntil = parsed;
      } else {
        holdUntil = Date.now() + holdSeconds * 1000;
        window.sessionStorage.setItem(HOLD_KEY, String(holdUntil));
      }
    } catch {
      holdUntil = Date.now() + holdSeconds * 1000;
    }

    const tick = () => {
      const left = Math.max(0, Math.floor((holdUntil - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !firedExpire.current) {
        firedExpire.current = true;
        onExpire?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [holdSeconds, onExpire]);

  if (remaining === null) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const expired = remaining === 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "label-lg bg-warning-bg text-warning flex items-center gap-2 px-4 py-2.5",
        className,
      )}
    >
      <Clock className="size-4" aria-hidden="true" />
      {expired ? (
        <span>{t("expired")}</span>
      ) : (
        <span className="tabular-nums">{t("active", { time: `${mm}:${ss}` })}</span>
      )}
    </div>
  );
}

/** Clear the persisted hold so the timer resets next entry. */
export function clearHold() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(HOLD_KEY);
}
