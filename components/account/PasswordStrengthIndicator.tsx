"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Password strength indicator per 14_auth.md.
 * Four buckets: Weak / Okay / Good / Strong. Scoring uses a heuristic:
 * length ≥ 8, mixed case, digits, symbols. Real auth replaces this with
 * zxcvbn when we ship Phase 2.
 */

const LABELS = ["Weak", "Okay", "Good", "Strong"] as const;
const COLORS = ["bg-error", "bg-warning", "bg-ink-100", "bg-success"] as const;

export function scorePassword(value: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  // Map 0..4 down to 0..3 for the 4-bucket display
  return Math.max(0, Math.min(3, score - 1)) as 0 | 1 | 2 | 3;
}

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const score = password.length === 0 ? -1 : scorePassword(password);
  return (
    <div aria-live="polite" className="flex flex-col gap-1.5">
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-colors duration-200",
              score >= i ? COLORS[score as 0 | 1 | 2 | 3] : "bg-ink-20",
            )}
          />
        ))}
      </div>
      <p className="label-sm text-ink-50">
        {score === -1
          ? "Use 8+ characters with a mix of letters, numbers, and symbols."
          : `Strength: ${LABELS[score as 0 | 1 | 2 | 3]}`}
      </p>
    </div>
  );
}
