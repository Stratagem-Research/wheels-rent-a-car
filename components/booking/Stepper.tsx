"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 5-step horizontal stepper per 04_booking_flow.md.
 *
 * INK & SIGNAL repaint: label-md typography, monochrome states. Future steps
 * are ink-50, active step is ink-100, completed steps are ink-100 with a
 * checkmark (success-coloured dot stays as the only "go" accent).
 *
 * - Steps 1–4 are clickable links when behind the current step (back-nav).
 * - Step 5 is read-only.
 * - Mobile collapses to a slim "Step N of 5" indicator + progress bar.
 * - WAI-ARIA: outer nav uses role="progressbar" with valuenow / valuemax.
 */

const STEPS = [
  { num: 1, label: "Vehicle", href: "/book/select-vehicle" },
  { num: 2, label: "Extras", href: "/book/extras" },
  { num: 3, label: "Protection", href: "/book/protection" },
  { num: 4, label: "Checkout", href: "/book/checkout" },
  { num: 5, label: "Confirmation", href: null },
] as const;

export interface StepperProps {
  current: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export function Stepper({ current, className }: StepperProps) {
  const labels = STEPS.map((s) => s.label).join(" → ");

  return (
    <nav
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-label={`Booking progress: step ${current} of 5 (${labels})`}
      className={cn("bg-paper border-border border-b", className)}
    >
      <div className="mx-auto max-w-[var(--container-full)] px-5 py-4 sm:px-5">
        <ol className="hidden items-center gap-2 sm:flex">
          {STEPS.map((step, i) => {
            const status =
              step.num < current ? "complete" : step.num === current ? "active" : "future";
            // step.href is null only for step 5, so the non-null check excludes it.
            const isLink = status === "complete" && step.href != null;
            return (
              <li key={step.num} className="flex flex-1 items-center gap-2">
                {isLink && step.href ? (
                  <Link
                    href={step.href}
                    className="group focus-visible:outline-ink-100 flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <StepDot status={status} num={step.num} />
                    <span className="label-md text-ink-100 group-hover:underline">
                      {step.label}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <StepDot status={status} num={step.num} />
                    <span
                      className={cn(
                        "label-md",
                        status === "active" && "text-ink-100",
                        status === "complete" && "text-ink-100",
                        status === "future" && "text-ink-50",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                )}
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn("h-px flex-1", step.num < current ? "bg-ink-100" : "bg-border")}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        {/* Mobile slim indicator */}
        <div className="flex items-center gap-3 sm:hidden">
          <div className="label-md text-ink-60 shrink-0">Step {current} of 5</div>
          <div className="bg-ink-20 relative h-1 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-ink-100 absolute inset-y-0 left-0 transition-[width] duration-300"
              style={{ width: `${(current / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function StepDot({ status, num }: { status: "complete" | "active" | "future"; num: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "label-sm inline-flex size-7 items-center justify-center rounded-full",
        status === "complete" && "bg-ink-100 text-paper",
        status === "active" && "bg-ink-100 text-paper",
        status === "future" && "bg-ink-20 text-ink-50",
      )}
    >
      {status === "complete" ? <Check className="size-3.5" /> : num}
    </span>
  );
}
