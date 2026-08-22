"use client";

import * as React from "react";
import { Input, type InputProps } from "@/components/ui/Input";

/**
 * Dollar-amount input backed by a cents integer. Plain `type="number"` here
 * fights the user two ways: the browser's spin-button arrows, and — because
 * the displayed value is `(cents / 100).toFixed(2)` recomputed from props on
 * every keystroke — typing "5." or trailing zeros gets reformatted out from
 * under the cursor mid-edit. Keeping the raw typed string in local state
 * until blur (or a full valid parse) fixes both.
 */
export function PriceCentsInput({
  cents,
  onChange,
  ...rest
}: {
  cents: number;
  onChange: (cents: number) => void;
} & Omit<InputProps, "value" | "onChange" | "type" | "inputMode">) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const display = draft ?? (cents / 100).toFixed(2);

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={(e) => {
        const raw = e.target.value;
        if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
        setDraft(raw);
        const parsed = Number(raw);
        if (raw !== "" && raw !== "." && !Number.isNaN(parsed)) {
          onChange(Math.round(parsed * 100));
        }
      }}
      onBlur={() => setDraft(null)}
      {...rest}
    />
  );
}
