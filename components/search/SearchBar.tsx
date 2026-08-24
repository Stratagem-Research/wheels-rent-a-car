"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { Calendar, ChevronDown, Clock, Edit3, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { DatePopover } from "@/components/ui/DatePopover";
import { Input } from "@/components/ui/Input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { TimePicker, nextAvailableTimeSlot, timeSlotAfter } from "@/components/ui/TimePicker";
import { LocationPicker } from "./LocationPicker";
import { useLastSearch } from "@/hooks/useLastSearch";
import { queryToSearch, searchToQuery } from "@/lib/search/persistence";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import type { Branch } from "@/types/domain";
import type { SearchCriteria } from "@/lib/search/types";
import { formatDateShortByLocale, formatTimeByLocale } from "@/lib/i18n/format";

/**
 * SearchBar — INK & SIGNAL rewrite (Phase 5). TravelPerk pattern: the search
 * bar sits on a paper canvas as the only floating element on the page.
 *
 * - Outer card: `card-floating` (paper, rounded.2xl, elevation-2, 24px padding).
 *   The ONLY card-style element with a shadow on the home page.
 * - Row 1: pickup location full-width with an inline "+ Different return"
 *   ghost link. When toggled, a paired return location field appears.
 * - Row 2: date range pair + pickup-time + return-time pickers.
 * - Row 3: promo code (collapsible tertiary link) on the left, single red
 *   `SHOW CARS` CTA on the right — full-width on mobile.
 *
 * Mobile (< lg) collapses to a single tap-pill that opens a bottom sheet
 * containing the same layout. The compact variant is the sticky band atop
 * funnel and Phase-7 results view.
 */

type SearchBarVariant = "expanded" | "compact";

export interface SearchBarProps {
  variant?: SearchBarVariant;
  branches: Branch[];
  className?: string;
}

export function SearchBar({ variant = "expanded", branches, className }: SearchBarProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { criteria: storedCriteria, setCriteria: persistCriteria } = useLastSearch();
  const urlKey = searchParams?.toString() ?? "";
  const urlCriteria = React.useMemo(
    () => (searchParams ? queryToSearch(new URLSearchParams(searchParams.toString())) : null),
    [searchParams],
  );
  const [criteria, setCriteriaState] = React.useState<SearchCriteria>(
    () => urlCriteria ?? storedCriteria,
  );

  React.useEffect(() => {
    const fromUrl = searchParams
      ? queryToSearch(new URLSearchParams(searchParams.toString()))
      : null;
    if (fromUrl) setCriteriaState(fromUrl);
  }, [urlKey, searchParams]);

  React.useEffect(() => {
    const fromUrl = searchParams
      ? queryToSearch(new URLSearchParams(searchParams.toString()))
      : null;
    if (!fromUrl) setCriteriaState(storedCriteria);
  }, [urlKey, searchParams, storedCriteria]);

  const setCriteria = React.useCallback(
    (next: SearchCriteria | ((prev: SearchCriteria) => SearchCriteria)) => {
      setCriteriaState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        persistCriteria(value);
        return value;
      });
    },
    [persistCriteria],
  );

  const [promoOpen, setPromoOpen] = React.useState(Boolean(criteria.promoCode));
  const [error, setError] = React.useState<string | null>(null);
  // Desktop-compact mode: the pill is itself a Sheet trigger, controlled
  // so we can close it after a successful submit (otherwise it would stay
  // open while the route changes).
  const [editorOpen, setEditorOpen] = React.useState(false);

  const submit = React.useCallback(() => {
    setError(null);
    const params = searchToQuery(criteria);
    const pickupAt = parseISO(`${criteria.pickupDate}T${criteria.pickupTime}`);
    const returnAt = parseISO(`${criteria.returnDate}T${criteria.returnTime}`);
    if (returnAt.getTime() <= pickupAt.getTime()) {
      setError(t("returnAfterPickupError"));
      return;
    }
    track(EVENTS.SEARCH_SUBMITTED, {
      pickupType: criteria.pickup.type,
      promo: criteria.promoCode ?? "",
    });
    setEditorOpen(false);
    if (pathname.includes("/vehicles")) {
      const merged = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [key, value] of params.entries()) merged.set(key, value);
      router.push(`/vehicles?${merged.toString()}`);
      return;
    }
    router.push(`/book/select-vehicle?${params.toString()}`);
  }, [criteria, pathname, router, searchParams, t]);

  return (
    <>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t("openSearchAria")}
              className={cn(
                "bg-paper rounded-pill flex w-full items-center gap-3 px-5 py-4 text-left",
                "shadow-[var(--shadow-elevation-2)]",
                "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
              )}
            >
              <MapPin className="text-ink-60 size-4 shrink-0" aria-hidden="true" />
              <span className="body-sm text-ink-95 flex-1 truncate font-medium">
                {summaryOf(criteria, branches, locale)}
              </span>
              <span className="label-md text-ink-100">{t("edit")}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
            <SheetTitle>{t("findYourCar")}</SheetTitle>
            <div className="mt-6">
              <ExpandedLayout
                criteria={criteria}
                setCriteria={setCriteria}
                branches={branches}
                promoOpen={promoOpen}
                setPromoOpen={setPromoOpen}
                error={error}
                onSubmit={submit}
                framed={false}
                locale={locale}
                t={t}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className={cn("hidden lg:block", className)}>
        {variant === "expanded" ? (
          <ExpandedLayout
            criteria={criteria}
            setCriteria={setCriteria}
            branches={branches}
            promoOpen={promoOpen}
            setPromoOpen={setPromoOpen}
            error={error}
            onSubmit={submit}
            locale={locale}
            t={t}
          />
        ) : (
          /* Desktop-compact: the entire pill is a Sheet trigger. Click
           * anywhere on the pill (location, dates, or the Edit affordance)
           * opens a bottom sheet with the full ExpandedLayout for editing.
           * The submit button inside the sheet closes it and runs the
           * search — no separate "Show cars" button on the band itself. */
          <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
            <SheetTrigger asChild>
              <CompactLayout criteria={criteria} branches={branches} />
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
              <SheetTitle>{t("editYourSearch")}</SheetTitle>
              <div className="mt-6">
                <ExpandedLayout
                  criteria={criteria}
                  setCriteria={setCriteria}
                  branches={branches}
                  promoOpen={promoOpen}
                  setPromoOpen={setPromoOpen}
                  error={error}
                  onSubmit={submit}
                  framed={false}
                  locale={locale}
                  t={t}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </>
  );
}

interface SharedProps {
  criteria: SearchCriteria;
  setCriteria: (next: SearchCriteria | ((prev: SearchCriteria) => SearchCriteria)) => void;
  branches: Branch[];
  promoOpen: boolean;
  setPromoOpen: (next: boolean) => void;
  error: string | null;
  onSubmit: () => void;
  locale: string;
  t: ReturnType<typeof useTranslations<"search">>;
  /** Wrap the layout in the card-floating shell. Disabled inside the bottom sheet. */
  framed?: boolean;
}

function ExpandedLayout({
  criteria,
  setCriteria,
  branches,
  promoOpen,
  setPromoOpen,
  error,
  onSubmit,
  locale,
  t,
  framed = true,
}: SharedProps) {
  // Chain dates → pickup-time so picking both dates closes the calendar
  // and opens the time picker — smooth one-after-the-other flow.
  const [datesOpen, setDatesOpen] = React.useState(false);
  const [pickupTimeOpen, setPickupTimeOpen] = React.useState(false);
  const [returnTimeOpen, setReturnTimeOpen] = React.useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const nowSlot = nextAvailableTimeSlot();
  const pickupMinTime = criteria.pickupDate === today ? nowSlot : undefined;
  const returnMinTime = (() => {
    const afterPickup =
      criteria.returnDate === criteria.pickupDate ? timeSlotAfter(criteria.pickupTime) : undefined;
    const afterNow = criteria.returnDate === today ? nowSlot : undefined;
    if (afterPickup && afterNow) return afterPickup > afterNow ? afterPickup : afterNow;
    return afterPickup ?? afterNow;
  })();

  return (
    <div className={cn(framed && "bg-paper rounded-2xl p-6 shadow-[var(--shadow-elevation-2)]")}>
      <div className="flex flex-col gap-5">
        {/* Row 1 — pickup + return locations, both always visible side by side. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("pickupLocation")}>
            <LocationPicker
              label="Pickup"
              branches={branches}
              value={criteria.pickup}
              onValueChange={(next) => setCriteria((p) => ({ ...p, pickup: next }))}
              placesAutocomplete
              renderTrigger={(summary, isPlaceholder) => (
                <FieldTrigger
                  icon={<MapPin className="text-ink-60 size-4 shrink-0" aria-hidden="true" />}
                  value={summary}
                  placeholder={isPlaceholder}
                  chevron
                />
              )}
            />
          </Field>

          <Field label={t("returnLocation")}>
            <LocationPicker
              label="Return"
              branches={branches}
              placesAutocomplete
              value={{
                type: criteria.return.address ? "address-delivery" : "branch",
                // Until the customer explicitly picks a different return
                // location, mirror the pickup branch instead of showing an
                // empty picker.
                locationId:
                  criteria.return.locationId ??
                  (criteria.return.sameAsPickup && criteria.pickup.type !== "address-delivery"
                    ? criteria.pickup.locationId
                    : undefined),
                address: criteria.return.address,
              }}
              onValueChange={(next) =>
                setCriteria((p) => ({
                  ...p,
                  return: {
                    sameAsPickup: false,
                    locationId: next.locationId,
                    address: next.address,
                  },
                }))
              }
              renderTrigger={(summary, isPlaceholder) => (
                <FieldTrigger
                  icon={<MapPin className="text-ink-60 size-4 shrink-0" aria-hidden="true" />}
                  value={summary}
                  placeholder={isPlaceholder}
                  chevron
                />
              )}
            />
          </Field>
        </div>

        {/* Row 2 — one date field (picks both pickup + return) + time pair. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={t("dates")} className="col-span-2">
            <DatePopover
              mode="range"
              open={datesOpen}
              onOpenChange={setDatesOpen}
              min={startOfDay(addDays(new Date(), 1))}
              rangeValue={{
                from: parseISO(criteria.pickupDate),
                to: parseISO(criteria.returnDate),
              }}
              onRangeChange={(r) => {
                setCriteria((p) => ({
                  ...p,
                  pickupDate: r.from ? format(r.from, "yyyy-MM-dd") : p.pickupDate,
                  returnDate: r.to ? format(r.to, "yyyy-MM-dd") : p.returnDate,
                }));
                if (r.from && r.to) {
                  // Both dates picked from the same calendar — close it and
                  // hand off to the pickup-time picker.
                  setDatesOpen(false);
                  setPickupTimeOpen(true);
                }
              }}
              renderTrigger={(_display, _isPlaceholder) => (
                <FieldTrigger
                  icon={<Calendar className="text-ink-60 size-4 shrink-0" aria-hidden="true" />}
                  value={`${formatDateShortByLocale(criteria.pickupDate, locale)} – ${formatDateShortByLocale(criteria.returnDate, locale)}`}
                  placeholder={false}
                />
              )}
            />
          </Field>

          <Field label={t("pickupTime")}>
            <TimePicker
              value={criteria.pickupTime}
              onValueChange={(t) => setCriteria((p) => ({ ...p, pickupTime: t }))}
              open={pickupTimeOpen}
              onOpenChange={setPickupTimeOpen}
              title={t("selectPickupTime")}
              minTime={pickupMinTime}
              renderTrigger={(display, isPlaceholder) => (
                <FieldTrigger
                  icon={<Clock className="text-ink-60 size-4 shrink-0" aria-hidden="true" />}
                  value={display}
                  placeholder={isPlaceholder}
                />
              )}
            />
          </Field>

          <Field label={t("returnTime")}>
            <TimePicker
              value={criteria.returnTime}
              onValueChange={(t) => setCriteria((p) => ({ ...p, returnTime: t }))}
              open={returnTimeOpen}
              onOpenChange={setReturnTimeOpen}
              title={t("selectReturnTime")}
              minTime={returnMinTime}
              renderTrigger={(display, isPlaceholder) => (
                <FieldTrigger
                  icon={<Clock className="text-ink-60 size-4 shrink-0" aria-hidden="true" />}
                  value={display}
                  placeholder={isPlaceholder}
                />
              )}
            />
          </Field>
        </div>

        {error ? (
          <p role="alert" className="field-error text-error">
            {error}
          </p>
        ) : null}

        {/* Row 3 — promo collapsible + single red CTA. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            {promoOpen ? (
              <Input
                placeholder={t("promoCode")}
                value={criteria.promoCode ?? ""}
                onChange={(e) => setCriteria((p) => ({ ...p, promoCode: e.target.value }))}
                aria-label={t("promoCode")}
              />
            ) : (
              <button
                type="button"
                onClick={() => setPromoOpen(true)}
                className={cn(
                  "label-lg text-ink-60 inline-flex items-center gap-2",
                  "hover:text-ink-100 underline-offset-4 hover:underline",
                  "focus-visible:outline-ink-100 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2",
                )}
              >
                + {t("addPromoCode")}
              </button>
            )}
          </div>
          <Button variant="cta" onClick={onSubmit} fullWidth className="sm:w-auto">
            {t("showCars")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* Desktop-compact pill — rendered as a button so the parent Sheet can use
 * it directly via `<SheetTrigger asChild>`. Whole pill is clickable; the
 * inline "Edit" affordance just signals that it's editable.
 *
 * Visual treatment:
 *   - No shadow (was elevation-2). Subtle ink-15 border instead so the
 *     pill reads as a contained element on the paper canvas without
 *     borrowing weight from the card-floating treatment reserved for
 *     the hero search bar.
 *   - Tighter vertical padding (py-2 vs py-3) — this is a summary band,
 *     not a primary surface.
 *   - No standalone Show-cars button: submission happens inside the
 *     editor sheet that the pill opens. */
const CompactLayout = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    criteria: SearchCriteria;
    branches: Branch[];
  }
>(function CompactLayout({ criteria, branches, className, ...props }, ref) {
  const t = useTranslations("search");
  const locale = useLocale();
  const { location } = summaryParts(criteria, branches);
  return (
    <button
      ref={ref}
      type="button"
      aria-label={t("editYourSearch")}
      className={cn(
        "bg-paper border-ink-15 hover:border-ink-30 rounded-pill flex w-full items-center gap-3 border px-5 py-2 text-left transition-colors sm:gap-4",
        "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
      {...props}
    >
      <MapPin className="text-ink-60 size-4 shrink-0" aria-hidden="true" />

      {/* Location + dates — two-tone read.
       *   - Location: body-md ink-95, semibold so it reads first.
       *   - Dates:    body-md ink-60, "May 16 | 10:00 AM - May 23 | 9:00 AM".
       *   - Vertical divider on sm+ separates the two clusters.
       * On narrow viewports the dates hide so the location keeps the room. */}
      <div className="body-md flex min-w-0 flex-1 items-center gap-3 truncate sm:gap-4">
        <span className="text-ink-95 truncate font-semibold">{location}</span>
        <span aria-hidden="true" className="bg-ink-20 hidden h-5 w-px shrink-0 sm:block" />
        <span
          className={cn(
            "label-md hidden shrink-0 items-center rounded-pill bg-ink-100 px-3 py-1 text-paper sm:inline-flex",
          )}
        >
          {datesForLocale(criteria, locale)}
        </span>
      </div>

      <span className="label-md text-ink-80 inline-flex shrink-0 items-center gap-1.5">
        <Edit3 className="size-4" aria-hidden="true" />
        {t("edit")}
      </span>
    </button>
  );
});

/* ── Field shell + inner trigger button ──────────────────────────────── */

function Field({
  label,
  action,
  children,
  className,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="field-label text-ink-60">{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

const FieldTrigger = React.forwardRef<
  HTMLButtonElement,
  {
    icon?: React.ReactNode;
    value: string;
    placeholder: boolean;
    chevron?: boolean;
    onClick?: () => void;
  } & React.ComponentPropsWithoutRef<"button">
>(function FieldTrigger({ icon, value, placeholder, chevron, className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "bg-paper flex h-14 w-full items-center gap-2 rounded-lg px-4 text-left",
        "border-border hover:border-ink-100 border transition-colors duration-150",
        "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-0",
        "data-[state=open]:border-ink-100",
        className,
      )}
      {...rest}
    >
      {icon}
      <span
        className={cn(
          "body-md min-w-0 flex-1 truncate",
          placeholder ? "text-ink-50" : "text-ink-95",
        )}
      >
        {value}
      </span>
      {chevron ? <ChevronDown className="text-ink-60 size-4 shrink-0" aria-hidden="true" /> : null}
    </button>
  );
});

/** Split summary used by the desktop sticky-band CompactLayout so the
 * location can render at full ink weight on the left and the dates at a
 * lighter ink-60 on the right (TravelPerk-style two-tone read). */
function summaryParts(
  criteria: SearchCriteria,
  branches: Branch[],
): { location: string; dates: string } {
  const branch = branches.find((b) => b.id === criteria.pickup.locationId);
  const location =
    criteria.pickup.type === "address-delivery"
      ? (criteria.pickup.address ?? "Address delivery")
      : (branch?.name ?? "Choose pickup");

  const dates =
    `${formatDateShortByLocale(criteria.pickupDate, "en")} | ${formatTimeByLocale(criteria.pickupTime, "en")}` +
    ` - ` +
    `${formatDateShortByLocale(criteria.returnDate, "en")} | ${formatTimeByLocale(criteria.returnTime, "en")}`;
  return { location, dates };
}

/** Mobile-trigger single-line summary. Same human-readable date + time
 * format as the desktop split, joined with a centre-dot and arrow so the
 * truncated pill still reads cleanly when it's the only visible part. */
function summaryOf(criteria: SearchCriteria, branches: Branch[], locale: string): string {
  const { location } = summaryParts(criteria, branches);
  const dates = datesForLocale(criteria, locale);
  return `${location} · ${dates}`;
}

function datesForLocale(criteria: SearchCriteria, locale: string): string {
  return (
    `${formatDateShortByLocale(criteria.pickupDate, locale)} | ${formatTimeByLocale(criteria.pickupTime, locale)}` +
    ` - ` +
    `${formatDateShortByLocale(criteria.returnDate, locale)} | ${formatTimeByLocale(criteria.returnTime, locale)}`
  );
}
