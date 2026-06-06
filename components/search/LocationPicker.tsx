"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, MapPin, Building2, History as HistoryIcon, Clock, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { readLastSearch } from "@/lib/search/persistence";
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
}: LocationPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const [addressDraft, setAddressDraft] = React.useState(value.address ?? "");
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

  const summary = formatSummary(value, branches);
  const isPlaceholder = summary === "Choose pickup location";

  const choose = (next: LocationValue) => {
    onValueChange(next);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {renderTrigger ? (
          (renderTrigger(summary, isPlaceholder) as React.ReactElement)
        ) : (
          <button
            id={id}
            type="button"
            aria-label={`${label} location: ${summary}`}
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
            "w-[640px] max-w-[calc(100vw-2rem)]",
          )}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr] sm:gap-4">
            {/* Left: history + our-branch list */}
            <div>
              {history ? (
                <Section title="History">
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

              <Section title="Our branch">
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
                <Section title="Airport pickup">
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

          <div className="bg-border my-3 h-px" />

          <Section title="Or deliver to me">
            <div className="px-1 pb-1">
              <Input
                placeholder="Hotel address, neighbourhood — anywhere in Greater Beirut"
                value={addressDraft}
                onChange={(e) => setAddressDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && addressDraft.trim()) {
                    e.preventDefault();
                    choose({ type: "address-delivery", address: addressDraft.trim() });
                  }
                }}
                startAdornment={<MapPin className="size-4" aria-hidden="true" />}
                aria-label="Delivery address"
              />
            </div>
          </Section>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-1">
      <div className="label-md text-ink-50 px-3 pt-1 pb-1.5 tracking-wide uppercase">{title}</div>
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
  return (
    <aside className="bg-ink-10 flex flex-col gap-2 rounded-md p-4">
      <header className="flex items-center gap-2">
        <Building2 className="text-ink-60 size-4 shrink-0" aria-hidden="true" />
        <span className="headline-xs text-ink-95">{branch.name}</span>
      </header>
      <p className="body-sm text-ink-60">{branch.address}</p>
      {branch.hours.length > 0 ? (
        <div className="mt-1 flex items-start gap-2">
          <Clock className="text-ink-60 mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <div className="label-md text-ink-60">
            {branch.hours[0]?.open24h
              ? "Open 24/7"
              : `${branch.hours[0]?.open ?? "—"}–${branch.hours[0]?.close ?? "—"} most days`}
          </div>
        </div>
      ) : null}
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

function formatSummary(value: LocationValue, branches: Branch[]): string {
  if (value.type === "address-delivery" && value.address) return value.address;
  const branch = branches.find((b) => b.id === value.locationId);
  if (branch) return branch.name;
  return "Choose pickup location";
}
