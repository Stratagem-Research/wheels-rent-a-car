"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

/*
 * Time picker — Sixt-aesthetic popover with a 2-column pill grid.
 *
 * Replaces the Sprint-1 native <select> implementation. Value contract
 * is unchanged ("HH:mm" strings) so existing consumers (SearchBar,
 * FlowSummaryPanel) keep working without code changes.
 *
 * Layout:
 *  - "Day" section: 06:00 → 16:30 (default visible).
 *  - "Evening" section: 17:00 → 23:30 (default visible).
 *  - "Late night / early morning" (00:00 → 05:30) revealed by a ghost
 *    link at the bottom of the popover so the default scroll is short.
 *
 * Selected pill = black filled. Hover = ink-20.
 */

export interface TimePickerProps {
  value?: string;
  onValueChange?: (next: string) => void;
  /** Slots strictly before this `HH:mm` are not selectable (past times). */
  minTime?: string;
  /** Custom time slots; defaults to the 30-minute scale. */
  options?: string[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  "aria-describedby"?: string;
  className?: string;
  /** Header inside the popover. */
  title?: string;
  /** Render a custom trigger (used by SearchBar's compact date+time pairs). */
  renderTrigger?: (display: string, isPlaceholder: boolean) => React.ReactNode;
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
}

function buildAllSlots(): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

const ALL_SLOTS = buildAllSlots();

/** First 30-minute slot strictly after `from`. */
export function nextAvailableTimeSlot(from = new Date()): string {
  const mins = from.getHours() * 60 + from.getMinutes() + 1;
  const rounded = Math.ceil(mins / 30) * 30;
  if (rounded >= 24 * 60) return "24:00";
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function slotAfter(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const next = (h ?? 0) * 60 + (m ?? 0) + 30;
  if (next >= 24 * 60) return "24:00";
  return `${String(Math.floor(next / 60)).padStart(2, "0")}:${String(next % 60).padStart(2, "0")}`;
}

export { slotAfter as timeSlotAfter };

export function TimePicker({
  value,
  onValueChange,
  options = ALL_SLOTS,
  placeholder,
  disabled,
  invalid,
  id,
  className,
  title,
  renderTrigger,
  open,
  onOpenChange,
  minTime,
  ...aria
}: TimePickerProps) {
  const t = useTranslations("searchUi");
  const [showOffHours, setShowOffHours] = React.useState(false);
  const display = value ?? placeholder ?? t("timePlaceholder");
  const isPlaceholder = !value;

  // Split into Day / Evening / Off-hours sections.
  const day: string[] = [];
  const evening: string[] = [];
  const offHours: string[] = [];
  for (const slot of options) {
    const h = Number(slot.split(":")[0]);
    if (h < 6) offHours.push(slot);
    else if (h < 17) day.push(slot);
    else evening.push(slot);
  }

  const isMobile = useIsMobile();

  const select = (slot: string) => {
    if (minTime && slot < minTime) return;
    onValueChange?.(slot);
    onOpenChange?.(false);
  };

  const triggerButton = renderTrigger ? (
    (renderTrigger(formatSlot(display), isPlaceholder) as React.ReactElement)
  ) : (
    <button
      id={id}
      type="button"
      disabled={disabled}
      data-invalid={invalid || undefined}
      aria-describedby={aria["aria-describedby"]}
      className={cn(
        "bg-surface flex h-13 w-full items-center gap-3 rounded-md px-4 text-left",
        "border transition-colors duration-150 ease-out",
        "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-0",
        invalid ? "border-error border-[1.5px]" : "border-ink-20 hover:border-ink-80 border",
        disabled && "bg-ink-10 cursor-not-allowed",
        className,
      )}
    >
      <Clock aria-hidden="true" className="text-ink-60 size-4 shrink-0" />
      <span
        className={cn(
          "body-md flex-1 tabular-nums",
          isPlaceholder ? "text-ink-50" : "text-ink-95",
        )}
      >
        {formatSlot(display)}
      </span>
    </button>
  );

  const slotsBody = (
    <>
      {day.length > 0 && (
        <Section label={t("timeDay")} slots={day} value={value} minTime={minTime} onSelect={select} />
      )}
      {evening.length > 0 && (
        <Section
          label={t("timeEvening")}
          slots={evening}
          value={value}
          minTime={minTime}
          onSelect={select}
        />
      )}
      {showOffHours && offHours.length > 0 ? (
        <Section
          label={t("timeOffHours")}
          slots={offHours}
          value={value}
          minTime={minTime}
          onSelect={select}
        />
      ) : offHours.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowOffHours(true)}
          className="label-md hover:text-ink-95 text-ink-60 mt-3 inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
        >
          <Clock aria-hidden="true" className="size-3.5" />
          {t("time24h")}
        </button>
      ) : null}
    </>
  );

  const slotsContent = (
    <>
      <header className="headline-xs text-ink-95 mb-3 text-center">
        {title ?? t("timeTitle")}
      </header>
      {slotsBody}
    </>
  );

  const slotsContentWithoutHeader = slotsBody;

  if (isMobile) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Trigger asChild>{triggerButton}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-[rgba(0,0,0,0.72)]",
              "transition-opacity duration-300 ease-out",
              "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
            )}
          />
          <Dialog.Content
            className={cn(
              "bg-surface fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl p-4",
              "transition-transform duration-300 ease-out focus:outline-none",
              "data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
            )}
          >
            <Dialog.Title asChild>
              <VisuallyHidden>{title ?? t("timeTitle")}</VisuallyHidden>
            </Dialog.Title>
            <div aria-hidden="true" className="bg-ink-20 mx-auto mb-4 h-1 w-12 rounded-full" />
            {slotsContent}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{triggerButton}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="bg-surface border-ink-20 z-50 flex w-[240px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border"
        >
          <div className="p-3 pb-2">
            <header className="headline-xs text-ink-95 text-center">
              {title ?? t("timeTitle")}
            </header>
          </div>
          <div className="overflow-y-auto rounded-b-xl px-3 pb-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-ink-10 [&::-webkit-scrollbar-thumb]:bg-ink-20 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ maxHeight: "320px" }}>
            {slotsContentWithoutHeader}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Section({
  label,
  slots,
  value,
  minTime,
  onSelect,
}: {
  label: string;
  slots: string[];
  value: string | undefined;
  minTime?: string;
  onSelect: (slot: string) => void;
}) {
  return (
    <section className="mb-3 last:mb-0">
      <div className="label-md text-ink-60 mb-2">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => {
          const active = slot === value;
          const unavailable = Boolean(minTime && slot < minTime);
          return (
            <button
              key={slot}
              type="button"
              disabled={unavailable}
              onClick={() => onSelect(slot)}
              aria-pressed={active}
              className={cn(
                "body-sm inline-flex h-8 items-center justify-center rounded-md tabular-nums transition-colors duration-100",
                unavailable
                  ? "bg-ink-10 text-ink-40 cursor-not-allowed"
                  : active
                    ? "bg-ink-95 text-paper"
                    : "bg-ink-10 text-ink-95 hover:bg-ink-20",
                "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-1",
              )}
            >
              {formatSlot(slot)}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** "08:30" → "8:30 AM" for display; we keep the 24h value in state. */
function formatSlot(slot: string): string {
  if (!/^\d{2}:\d{2}$/.test(slot)) return slot;
  const [hh, mm] = slot.split(":");
  const h = Number(hh);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${mm} ${suffix}`;
}
