"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { addMonths, format, isAfter, isBefore } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

import "react-day-picker/dist/style.css";

/*
 * Date popover — Sixt-aesthetic rewrite (Phase 2 of redesign).
 *
 * - Range mode: 3 months side-by-side; ranges select first-click start,
 *   second-click end. Selected = black filled, in-range = ink-10.
 * - Single mode: 1 month, still used for the checkout DOB field and
 *   long-form date inputs.
 * - Today: 1px black ring (matches Sixt).
 * - Past dates: muted grey, disabled.
 */

export interface DatePopoverProps {
  mode?: "single" | "range";
  value?: Date | undefined;
  onValueChange?: (next: Date | undefined) => void;
  rangeValue?: { from?: Date; to?: Date };
  onRangeChange?: (next: { from?: Date; to?: Date }) => void;
  /** Minimum selectable date; defaults to today. */
  min?: Date;
  /** Maximum selectable date; defaults to today + 11 months (search-bar rules). */
  max?: Date;
  /** Label for the trigger button. */
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  "aria-describedby"?: string;
  /** Override the month-count. Default: 1 for single, 3 for range (Sixt). */
  numberOfMonths?: number;
  className?: string;
  /** Custom trigger renderer for the Sixt-style date+time field pair. */
  renderTrigger?: (display: string, isPlaceholder: boolean) => React.ReactNode;
  /** Controlled open state (used by the new SearchBar to chain time-after-date). */
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
  /**
   * Which end of the range this trigger edits, when a complete range
   * already exists and the user clicks a new date. "start" (default)
   * restarts a fresh two-click pick from that date — used by the pickup
   * field. "end" instead keeps `from` anchored and only moves `to` — used
   * by the return field, so clicking a new return date doesn't silently
   * overwrite the pickup date.
   */
  anchor?: "start" | "end";
}

function defaultMin() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function defaultMax() {
  const d = new Date();
  d.setMonth(d.getMonth() + 11);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function DatePopover({
  mode = "single",
  value,
  onValueChange,
  rangeValue,
  onRangeChange,
  min = defaultMin(),
  max = defaultMax(),
  placeholder,
  disabled,
  invalid,
  id,
  numberOfMonths,
  className,
  renderTrigger,
  open,
  onOpenChange,
  anchor = "start",
  ...aria
}: DatePopoverProps) {
  const t = useTranslations("searchUi");
  const monthCount = numberOfMonths ?? (mode === "range" ? 3 : 1);
  const ph = placeholder ?? t("dateSelect");

  const display =
    mode === "single"
      ? value
        ? format(value, "dd MMM yyyy")
        : ph
      : rangeValue?.from
        ? rangeValue.to
          ? `${format(rangeValue.from, "dd MMM")} – ${format(rangeValue.to, "dd MMM yyyy")}`
          : format(rangeValue.from, "dd MMM yyyy")
        : ph;

  const isPlaceholder = (mode === "single" && !value) || (mode === "range" && !rangeValue?.from);

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        {renderTrigger ? (
          (renderTrigger(display, isPlaceholder) as React.ReactElement)
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
              "focus-visible:shadow-[0_0_0_4px_var(--color-signal-blue-bg)]",
              invalid
                ? "border-error border-[1.5px]"
                : "border-border hover:border-border-strong border",
              disabled && "bg-ink-10 cursor-not-allowed",
              className,
            )}
          >
            <Calendar aria-hidden="true" className="text-ink-60 size-4 shrink-0" />
            <span className={cn("body-md flex-1", isPlaceholder ? "text-ink-50" : "text-ink-95")}>
              {display}
            </span>
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className={cn(
            "bg-surface border-ink-20 z-50 rounded-xl border p-4",
            // The 3-month range view needs horizontal scrolling at smaller widths.
            mode === "range" && "max-w-[calc(100vw-2rem)] overflow-x-auto",
          )}
        >
          {mode === "single" ? (
            <DayPicker
              mode="single"
              selected={value}
              onSelect={onValueChange}
              disabled={(d) => isBefore(d, min) || isAfter(d, max)}
              numberOfMonths={monthCount}
              showOutsideDays={false}
              classNames={dayPickerClasses}
              components={dayPickerComponents}
            />
          ) : (
            <RangeView
              rangeValue={rangeValue}
              onRangeChange={onRangeChange}
              min={min}
              max={max}
              monthCount={monthCount}
              anchor={anchor}
            />
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * Range view — own component so it can hold the controlled "current month"
 * state that drives the custom top-right nav arrows.
 *
 * Click behavior override: when the popover opens with a complete range
 * (from + to both set) and the user clicks a new date, react-day-picker's
 * default range-mode behavior is to complete/replace the existing range —
 * which our flow interpreted as "both dates picked, close calendar and
 * auto-open the time picker". That was wrong UX: the user expected the
 * click to set the NEW pickup date and keep the calendar open for them
 * to pick the return.
 *
 * We use react-day-picker's `onSelect(selected, triggerDate)` signature to
 * intercept: if a complete range existed before this click, we reset to
 * `{ from: triggerDate, to: undefined }` instead. The user's NEXT click
 * then sets `to`, and only then does SearchBar close + advance to time.
 */
function RangeView({
  rangeValue,
  onRangeChange,
  min,
  max,
  monthCount,
  anchor = "start",
}: {
  rangeValue?: { from?: Date; to?: Date };
  onRangeChange?: (next: { from?: Date; to?: Date }) => void;
  min: Date;
  max: Date;
  monthCount: number;
  anchor?: "start" | "end";
}) {
  // Controlled month state — drives our custom top-right nav.
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => rangeValue?.from ?? new Date(),
  );

  const handleSelect = (_selected: { from?: Date; to?: Date } | undefined, triggerDate: Date) => {
    const hadCompleteRange = !!(rangeValue?.from && rangeValue?.to);
    if (hadCompleteRange && triggerDate) {
      // Editing the return field: keep the pickup date anchored and only
      // move the return date, as long as the new date is still after it.
      if (anchor === "end" && rangeValue?.from && isAfter(triggerDate, rangeValue.from)) {
        onRangeChange?.({ from: rangeValue.from, to: triggerDate });
        return;
      }
      // Pickup field (or an "end" click that can't be a valid return date,
      // e.g. on/before the current pickup) — start a NEW range from here.
      // Keep the calendar open for the second click.
      onRangeChange?.({ from: triggerDate, to: undefined });
      return;
    }
    onRangeChange?.({ from: _selected?.from, to: _selected?.to });
  };

  return (
    <>
      <RangeHeader
        from={rangeValue?.from}
        to={rangeValue?.to}
        onReset={() => onRangeChange?.({ from: undefined, to: undefined })}
        onPrevMonth={() => setCurrentMonth((d) => addMonths(d, -1))}
        onNextMonth={() => setCurrentMonth((d) => addMonths(d, 1))}
      />
      <DayPicker
        mode="range"
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        hideNavigation
        selected={rangeValue?.from ? { from: rangeValue.from, to: rangeValue.to } : undefined}
        onSelect={handleSelect}
        disabled={(d) => isBefore(d, min) || isAfter(d, max)}
        numberOfMonths={monthCount}
        showOutsideDays={false}
        classNames={dayPickerClasses}
        components={dayPickerComponents}
      />
    </>
  );
}

/**
 * Step header inside range-mode date popover. The user often picks a pickup
 * date and then doesn't realise they still need to pick a return — this
 * header makes the two-step nature explicit and updates live as the range
 * fills in. The "Reset" button is a smooth escape if they pick wrong dates
 * (instead of having to manually re-click). Top-right nav arrows replace
 * the per-month chevrons react-day-picker ships by default — single source
 * of navigation at the top of the popover.
 */
function RangeHeader({
  from,
  to,
  onReset,
  onPrevMonth,
  onNextMonth,
}: {
  from?: Date;
  to?: Date;
  onReset: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const t = useTranslations("searchUi");
  const step = !from ? 1 : !to ? 2 : 3;
  const heading =
    step === 1
      ? t("dateHeadingPickup")
      : step === 2
        ? t("dateHeadingReturn")
        : t("dateHeadingSet");
  const meta =
    step === 1
      ? t("dateStep1")
      : step === 2 && from
        ? t("datePickupMeta", { date: format(from, "d MMM yyyy") })
        : from && to
          ? `${format(from, "d MMM")} → ${format(to, "d MMM yyyy")}`
          : null;

  return (
    <div className="border-ink-15 mb-4 flex items-center justify-between gap-3 border-b pb-3">
      <div className="flex flex-col gap-0.5">
        <span className="label-sm text-ink-50">{meta}</span>
        <span className="headline-xs text-ink-100">{heading}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {step > 1 ? (
          <button
            type="button"
            onClick={onReset}
            className="label-md text-ink-60 hover:text-ink-100 mr-2 underline-offset-4 hover:underline"
          >
            {t("dateReset")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label={t("datePrevMonth")}
          className="border-ink-20 text-ink-80 hover:bg-ink-10 hover:text-ink-100 focus-visible:outline-ink-100 inline-flex size-8 items-center justify-center rounded-full border focus-visible:outline-2"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label={t("dateNextMonth")}
          className="border-ink-20 text-ink-80 hover:bg-ink-10 hover:text-ink-100 focus-visible:outline-ink-100 inline-flex size-8 items-center justify-center rounded-full border focus-visible:outline-2"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// react-day-picker v10 classNames API. Keys match `UI`, `DayFlag`,
// `SelectionState` enums from the library.
const dayPickerClasses = {
  root: "body-sm",
  months: "flex gap-6 flex-col sm:flex-row",
  month: "space-y-2",
  month_caption: "flex items-center justify-between px-1 pb-2 min-h-8",
  caption_label: "headline-xs text-ink-95",
  nav: "flex items-center gap-1",
  button_previous:
    "inline-flex size-8 items-center justify-center rounded-md text-ink-60 hover:bg-ink-10 hover:text-ink-95 focus-visible:outline-2 focus-visible:outline-ink-100",
  button_next:
    "inline-flex size-8 items-center justify-center rounded-md text-ink-60 hover:bg-ink-10 hover:text-ink-95 focus-visible:outline-2 focus-visible:outline-ink-100",
  month_grid: "w-full border-collapse",
  weekdays: "flex",
  weekday: "w-9 label-sm text-ink-50 font-normal py-1",
  week: "flex w-full mt-1",
  day: "size-9 text-center p-0 relative",
  day_button:
    "inline-flex size-9 items-center justify-center rounded-full body-sm text-ink-95 hover:bg-ink-10 focus-visible:outline-2 focus-visible:outline-ink-100",
  selected: "[&_button]:bg-ink-95 [&_button]:text-paper [&_button]:hover:bg-ink-90",
  today: "[&_button]:ring-1 [&_button]:ring-ink-95 [&_button]:ring-inset",
  outside: "[&_button]:text-ink-50 [&_button]:opacity-40",
  disabled: "[&_button]:text-ink-40 [&_button]:cursor-not-allowed [&_button]:hover:bg-transparent",
  range_middle:
    "bg-ink-10 [&_button]:bg-transparent [&_button]:text-ink-95 [&_button]:rounded-none [&_button]:hover:bg-ink-20",
  range_start: "[&_button]:bg-ink-95 [&_button]:text-paper [&_button]:rounded-full",
  range_end: "[&_button]:bg-ink-95 [&_button]:text-paper [&_button]:rounded-full",
  hidden: "invisible",
};

const dayPickerComponents = {
  Chevron: (props: { orientation?: "left" | "right" | "up" | "down" }) =>
    props.orientation === "left" ? (
      <ChevronLeft className="size-4" aria-hidden="true" />
    ) : (
      <ChevronRight className="size-4" aria-hidden="true" />
    ),
};
