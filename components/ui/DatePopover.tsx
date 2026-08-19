"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DayPicker } from "react-day-picker";
import { addMonths, format, isAfter, isBefore, startOfDay } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

import "react-day-picker/dist/style.css";

/*
 * Date popover — Sixt-aesthetic rewrite (Phase 2 of redesign).
 *
 * - Range mode: both pickup and return dates are picked from one calendar —
 *   first click sets the start, second click sets the end. 2 months
 *   side-by-side on desktop, 1 month on mobile (viewport <= 640px).
 *   Selected = black filled, in-range = ink-10.
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
}

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
  ...aria
}: DatePopoverProps) {
  const t = useTranslations("searchUi");
  const isMobile = useIsMobile();
  const monthCount = numberOfMonths ?? (mode === "single" ? 1 : isMobile ? 1 : 2);
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

  const triggerButton = renderTrigger ? (
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
  );

  const calendarBody =
    mode === "single" ? (
      <DayPicker
        mode="single"
        selected={value}
        onSelect={onValueChange}
        disabled={(d) => isBefore(startOfDay(d), startOfDay(min)) || isAfter(startOfDay(d), startOfDay(max))}
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
      />
    );

  // Mobile: a Popover anchored/flipped relative to the trigger can still
  // clip against the (address-bar-shrunk) viewport when the trigger sits
  // high on the page. Use a bottom sheet instead — same pattern as the
  // rest of the app (components/ui/Sheet.tsx) — since its `fixed`
  // positioning is applied directly, not nested inside a transformed
  // floating-ui wrapper the way Popover.Content is.
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
              className,
            )}
          >
            <Dialog.Title asChild>
              <VisuallyHidden>{ph}</VisuallyHidden>
            </Dialog.Title>
            <div aria-hidden="true" className="bg-ink-20 mx-auto mb-4 h-1 w-12 rounded-full" />
            {calendarBody}
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
          collisionPadding={16}
          className={cn(
            "bg-surface border-ink-20 z-50 max-h-[85vh] overflow-y-auto rounded-xl border p-4",
            mode === "range" && "max-w-[calc(100vw-2rem)] overflow-x-auto",
          )}
        >
          {calendarBody}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * Range view — own component so it can hold the controlled "current month"
 * state that drives the custom top-right nav arrows, plus the click-sequence
 * state described below.
 *
 * So the two-click sequence is tracked with its own local state,
 * `localRange`, independent of the parent's props:
 * - `null` → nothing local yet; show the parent's last committed pair as-is.
 * - `{ from, to: undefined }` → first click anchored here, second click
 *   still pending. Shown instead of the parent's (possibly stale) pair.
 * - `{}` (both undefined) → the user hit Reset; show nothing selected and
 *   wait for a fresh first click.
 * The second click always completes the range, sorted so the earlier of
 * the two dates becomes `from` (pickup) and the later becomes `to` (return)
 * regardless of click order, then commits the pair up via `onRangeChange`
 * and clears back to `null`.
 */
function RangeView({
  rangeValue,
  onRangeChange,
  min,
  max,
  monthCount,
}: {
  rangeValue?: { from?: Date; to?: Date };
  onRangeChange?: (next: { from?: Date; to?: Date }) => void;
  min: Date;
  max: Date;
  monthCount: number;
}) {
  // Controlled month state — drives our custom top-right nav.
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => rangeValue?.from ?? new Date(),
  );
  const [localRange, setLocalRange] = React.useState<{ from?: Date; to?: Date } | null>(null);

  // What the calendar actually shows: any local override (in-progress pick
  // or a Reset-cleared blank) always wins over the parent's committed pair.
  const displayed = localRange ?? rangeValue;

  const handleSelect = (_selected: { from?: Date; to?: Date } | undefined, triggerDate: Date) => {
    if (!triggerDate) return;
    if (localRange?.from && !localRange.to) {
      // Second click completes the range.
      const [from, to] = isBefore(triggerDate, localRange.from)
        ? [triggerDate, localRange.from]
        : [localRange.from, triggerDate];
      setLocalRange(null);
      onRangeChange?.({ from, to });
      return;
    }
    // First click of a fresh pick (nothing local yet, or a Reset-cleared blank).
    setLocalRange({ from: triggerDate, to: undefined });
  };

  return (
    <>
      <RangeHeader
        from={displayed?.from}
        to={displayed?.to}
        onReset={() => setLocalRange({})}
        onPrevMonth={() => setCurrentMonth((d) => addMonths(d, -1))}
        onNextMonth={() => setCurrentMonth((d) => addMonths(d, 1))}
      />
      <DayPicker
        mode="range"
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        hideNavigation
        selected={displayed?.from ? { from: displayed.from, to: displayed.to } : undefined}
        onSelect={handleSelect}
        disabled={(d) => isBefore(startOfDay(d), startOfDay(min)) || isAfter(startOfDay(d), startOfDay(max))}
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
  weekday: "flex-1 text-center label-sm text-ink-50 font-normal py-1",
  week: "flex w-full mt-1",
  day: "flex-1 flex items-center justify-center p-0 relative",
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
