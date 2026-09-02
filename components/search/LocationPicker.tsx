/// <reference types="google.maps" />
"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, MapPin, Building2, History as HistoryIcon, Clock, Plane } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { readLastSearch } from "@/lib/search/persistence";
import { loadGooglePlaces } from "@/lib/maps/loadGoogleMaps";
import type { Branch, PickupType } from "@/types/domain";

/**
 * Location picker — Sixt-aesthetic rewrite (Phase 2 redesign).
 *
 * Left column: History (last-used pickup from localStorage `wheels.lastSearch`)
 *              + "Our branch" list (single Hazmieh entry in Phase 1).
 * Right column: Station details for the focused branch — address, hours,
 *               24/7 chip if applicable.
 * Bottom row: Address delivery input.
 *
 * On mobile (< 640px) the right details panel collapses underneath.
 */

export interface LocationValue {
  type: PickupType;
  locationId?: string;
  address?: string;
  /** Decimal degrees + Google's place id — set when `address` was chosen via
   *  Places Autocomplete, so a delivery fee can be computed from real
   *  distance instead of trusting a free-typed address. Absent when the
   *  customer just typed an address without picking a suggestion. */
  lat?: number;
  lng?: number;
  placeId?: string;
}

export interface LocationPickerProps {
  branches: Branch[];
  value: LocationValue;
  onValueChange: (next: LocationValue) => void;
  /** "Pickup" or "Return" — drives the aria-label and placeholder. */
  label: string;
  id?: string;
  className?: string;
  /** Custom trigger renderer (new SearchBar uses this for the inline pill). */
  renderTrigger?: (summary: string, isPlaceholder: boolean) => React.ReactNode;
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
  /** Attach Google Places Autocomplete to the delivery-address field. */
  placesAutocomplete?: boolean;
}

export function LocationPicker({
  branches,
  value,
  onValueChange,
  label,
  id,
  className,
  renderTrigger,
  open: controlledOpen,
  onOpenChange,
  placesAutocomplete = false,
}: LocationPickerProps) {
  const t = useTranslations("searchUi");
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const [addressDraft, setAddressDraft] = React.useState(value.address ?? "");
  // Ref so the place-selection handler (attached once per mounted element)
  // always sees the latest `choose` without needing the element recreated.
  const chooseRef = React.useRef<(next: LocationValue) => void>(() => { });
  // Split branches: our physical hub vs airport meet-and-greet locations.
  // Airport branches get their own section + plane icon so the meet-and-
  // greet option is obvious next to the standard pickup hub.
  const ourBranches = branches.filter((b) => !b.isAirport);
  const airportBranches = branches.filter((b) => b.isAirport);

  // The branch hovered/focused on the left — drives the right panel.
  const [focusedBranchId, setFocusedBranchId] = React.useState<string | null>(
    value.locationId ?? ourBranches[0]?.id ?? null,
  );

  // Pull a one-shot history entry from the search-persistence layer.
  // SSR-safe: server renders without history; the effect reads localStorage
  // and reveals the entry on the client.
  /* eslint-disable react-hooks/set-state-in-effect */
  const [history, setHistory] = React.useState<Branch | null>(null);
  React.useEffect(() => {
    const stored = readLastSearch();
    const id = stored?.pickup.locationId;
    if (!id) return;
    const branch = branches.find((b) => b.id === id);
    if (branch) setHistory(branch);
  }, [branches]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const focusedBranch = branches.find((b) => b.id === focusedBranchId) ?? ourBranches[0] ?? null;

  const resolved = formatSummary(value, branches);
  const isPlaceholder = resolved === null;
  const summary = resolved ?? (label === "Return" ? t("locChooseReturn") : t("locChoose"));

  const choose = (next: LocationValue) => {
    onValueChange(next);
    setOpen(false);
  };
  chooseRef.current = choose;

  const onPlaceSelected = React.useCallback((next: { address: string; lat?: number; lng?: number; placeId?: string }) => {
    setAddressDraft(next.address);
    chooseRef.current({ type: "address-delivery", ...next });
  }, []);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {renderTrigger ? (
          (renderTrigger(summary, isPlaceholder) as React.ReactElement)
        ) : (
          <button
            id={id}
            type="button"
            aria-label={t("locAria", { label, summary })}
            className={cn(
              "bg-surface flex h-13 w-full items-center gap-3 rounded-md px-4 text-left",
              "border-ink-20 hover:border-ink-80 border transition-colors duration-150",
              "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-0",
              className,
            )}
          >
            <LocationIcon type={value.type} className="text-ink-60 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="label-md text-ink-50 tracking-wider uppercase">{label}</div>
              <div className="body-md text-ink-95 truncate">{summary}</div>
            </div>
            <ChevronDown aria-hidden="true" className="text-ink-60 size-4 shrink-0" />
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className={cn(
            "bg-surface border-ink-20 z-50 rounded-xl border p-3",
            "w-150 max-w-[calc(100vw-3rem)]",
          )}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr] sm:gap-4">
            {/* Left: history + our-branch list */}
            <div>
              {history ? (
                <Section title={t("locHistory")}>
                  <Option
                    icon={<HistoryIcon className="size-4 shrink-0" aria-hidden="true" />}
                    onClick={() => choose({ type: "branch", locationId: history.id })}
                    onFocus={() => setFocusedBranchId(history.id)}
                    onMouseEnter={() => setFocusedBranchId(history.id)}
                  >
                    <span className="headline-xs">{history.name}</span>
                  </Option>
                </Section>
              ) : null}

              <Section title={t("locOurBranch")}>
                {ourBranches.map((branch) => (
                  <Option
                    key={branch.id}
                    icon={<Building2 className="size-4 shrink-0" aria-hidden="true" />}
                    selected={value.type === "branch" && value.locationId === branch.id}
                    onClick={() => choose({ type: "branch", locationId: branch.id })}
                    onFocus={() => setFocusedBranchId(branch.id)}
                    onMouseEnter={() => setFocusedBranchId(branch.id)}
                  >
                    <span className="headline-xs">{branch.name}</span>
                  </Option>
                ))}
              </Section>

              {airportBranches.length ? (
                <Section title={t("locAirport")}>
                  {airportBranches.map((branch) => (
                    <Option
                      key={branch.id}
                      icon={<Plane className="size-4 shrink-0" aria-hidden="true" />}
                      selected={value.type === "branch" && value.locationId === branch.id}
                      onClick={() => choose({ type: "branch", locationId: branch.id })}
                      onFocus={() => setFocusedBranchId(branch.id)}
                      onMouseEnter={() => setFocusedBranchId(branch.id)}
                    >
                      <span className="headline-xs">{branch.name}</span>
                    </Option>
                  ))}
                </Section>
              ) : null}
            </div>

            {/* Right: station details for the focused branch */}
            {focusedBranch ? <StationDetails branch={focusedBranch} /> : null}
          </div>

          <div className="bg-ink-10 border-ink-30 mt-3 rounded-lg border p-3">
            <div className="flex items-center gap-1.5 pb-2">
              <MapPin className="text-ink-80 size-3.5 shrink-0" aria-hidden="true" />
              <span className="label-sm text-ink-80 font-semibold tracking-wide uppercase">{t("locDeliver")}</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-ink-30 bg-white [&_input::placeholder]:text-xs [&_input::placeholder]:text-ink-50">
              {placesAutocomplete ? (
                <GooglePlaceAutocompleteField
                  placeholder={t("locDeliverPlaceholder")}
                  ariaLabel={t("locDeliverAria")}
                  fallbackValue={addressDraft}
                  onFallbackChange={setAddressDraft}
                  onFallbackCommit={(address) => choose({ type: "address-delivery", address })}
                  onSelect={onPlaceSelected}
                />
              ) : (
                <Input
                  placeholder={t("locDeliverPlaceholder")}
                  value={addressDraft}
                  onChange={(e) => setAddressDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && addressDraft.trim()) {
                      e.preventDefault();
                      choose({ type: "address-delivery", address: addressDraft.trim() });
                    }
                  }}
                  startAdornment={<MapPin className="size-4" aria-hidden="true" />}
                  aria-label={t("locDeliverAria")}
                  autoComplete="off"
                  className="border-0 rounded-none shadow-none focus-within:outline-none focus-within:shadow-none"
                />
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Section({ title, bold, children }: { title: string; bold?: boolean; children: React.ReactNode }) {
  return (
    <section className="py-1">
      <div className={cn(
        "label-md px-3 pt-1 pb-1.5 tracking-wide uppercase",
        bold ? "text-ink-95 font-bold" : "text-ink-50",
      )}>{title}</div>
      {children}
    </section>
  );
}

function Option({
  icon,
  children,
  selected,
  onClick,
  onFocus,
  onMouseEnter,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left",
        "hover:bg-ink-10 transition-colors duration-100",
        "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-0",
        selected && "bg-ink-10",
      )}
    >
      <span className="text-ink-60">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

function StationDetails({ branch }: { branch: Branch }) {
  const t = useTranslations("searchUi");
  return (
    <aside className="bg-ink-10 flex flex-col gap-2 rounded-md p-4 lg:mt-2">
      <header className="flex items-center gap-2">
        <Building2 className="text-ink-60 size-4 shrink-0" aria-hidden="true" />
        <span className="headline-xs text-ink-95">{branch.name}</span>
      </header>
      <p className="body-sm text-ink-60">{branch.address}</p>
      {/* {branch.hours.length > 0 ? (
        <div className="mt-1 flex items-start gap-2">
          <Clock className="text-ink-60 mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <div className="label-md text-ink-60">
            {branch.hours[0]?.open24h
              ? t("locOpen247")
              : t("locHours", {
                  open: branch.hours[0]?.open ?? "—",
                  close: branch.hours[0]?.close ?? "—",
                })}
          </div>
        </div>
      ) : null} */}
    </aside>
  );
}

function LocationIcon({ type, className }: { type: PickupType; className?: string }) {
  switch (type) {
    case "address-delivery":
      return <MapPin aria-hidden="true" className={className} />;
    case "airport":
    case "chauffeur":
    case "branch":
    default:
      return <Building2 aria-hidden="true" className={className} />;
  }
}

/** Returns the display summary, or null when nothing is selected yet (the
 * caller substitutes a localized "Choose pickup location" placeholder). */
function formatSummary(value: LocationValue, branches: Branch[]): string | null {
  if (value.type === "address-delivery" && value.address) return value.address;
  const branch = branches.find((b) => b.id === value.locationId);
  if (branch) return branch.name;
  return null;
}

/**
 * Delivery-address field backed by Google's `PlaceAutocompleteElement` — the
 * class Google now recommends over the deprecated `Autocomplete` (closed to
 * new API keys since March 2025). Unlike the old class, this is a
 * self-contained custom element with its own internal input, not something
 * you attach to an existing `<input>` — so it fully replaces our plain
 * `Input` once the Places library has loaded, and falls back to that plain
 * input (still fully usable, just without suggestions) until then or if the
 * library fails to load (no key configured, network error, etc.).
 */
function GooglePlaceAutocompleteField({
  placeholder,
  ariaLabel,
  fallbackValue,
  onFallbackChange,
  onFallbackCommit,
  onSelect,
}: {
  placeholder: string;
  ariaLabel: string;
  fallbackValue: string;
  onFallbackChange: (next: string) => void;
  onFallbackCommit: (address: string) => void;
  onSelect: (next: { address: string; lat?: number; lng?: number; placeId?: string }) => void;
}) {
  const [ready, setReady] = React.useState(false);
  // Refs so the mount callback (created once) always sees latest props
  // without needing the custom element torn down and recreated.
  const onSelectRef = React.useRef(onSelect);
  onSelectRef.current = onSelect;

  const mountElement = React.useCallback((container: HTMLDivElement | null) => {
    if (!container) return;
    let cancelled = false;

    loadGooglePlaces()
      ?.then((places) => {
        if (cancelled) return;
        const el = new places.PlaceAutocompleteElement({ includedRegionCodes: ["lb"] });
        el.classList.add("wheels-place-autocomplete");
        (el as unknown as { placeholder: string }).placeholder = placeholder;
        el.setAttribute("aria-label", ariaLabel);
        el.addEventListener("gmp-select", (event) => {
          void (async () => {
            const place = event.placePrediction.toPlace();
            await place.fetchFields({ fields: ["formattedAddress", "location", "id"] });
            const address = place.formattedAddress ?? "";
            if (!address) return;
            onSelectRef.current({
              address,
              lat: place.location?.lat(),
              lng: place.location?.lng(),
              placeId: place.id,
            });
          })();
        });
        container.appendChild(el);
        setReady(true);
      })
      .catch((err) => {
        console.warn("[LocationPicker] Google Places failed to load", err);
      });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
    // Mount once per popover-open — placeholder/ariaLabel don't change mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <div ref={mountElement} className={cn(!ready && "hidden")} />
      {ready ? null : (
        <Input
          placeholder={placeholder}
          value={fallbackValue}
          onChange={(e) => onFallbackChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && fallbackValue.trim()) {
              e.preventDefault();
              onFallbackCommit(fallbackValue.trim());
            }
          }}
          startAdornment={<MapPin className="size-4" aria-hidden="true" />}
          aria-label={ariaLabel}
          autoComplete="off"
          className="border rounded-xl shadow-none"
        />
      )}
    </div>
  );
}
