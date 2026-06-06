"use client";

import * as React from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { Edit3, ChevronUp, X } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import type {
  AddOn,
  BookingDraft,
  BookingPriceBreakdown,
  Branch,
  ProtectionTier,
  Vehicle,
} from "@/types/domain";
import { computePrice, formatUsd, rentalDays } from "@/lib/booking/pricing";

/*
 * Flow-mode booking summary panel per 04_booking_flow.md"Sticky booking
 * summary panel (right rail)".
 *
 *   Desktop  — sticky right rail (parent owns `position: sticky`).
 *   Mobile   — collapses to a bottom action bar showing"Total $X · See
 *              details ▾". Tap expands to a bottom sheet with the full panel.
 *
 *   Edit-search modal — opens with a short summary of the current search.
 *                       Wired to a back-nav to step 1 in this sprint; the
 *                       full edit form arrives with the modal pattern in
 *                       Sprint 6.
 *   Price-details modal — full line-item table.
 */

export interface FlowSummaryPanelProps {
  draft: BookingDraft;
  vehicle?: Vehicle;
  branches: Branch[];
  addOns: AddOn[];
  tiers: ProtectionTier[];
  primary: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  /** Optional secondary action below the primary (e.g. Save & exit trigger). */
  secondary?: React.ReactNode;
}

export function FlowSummaryPanel(props: FlowSummaryPanelProps) {
  const price = React.useMemo(
    () =>
      computePrice({
        draft: props.draft,
        vehicle: props.vehicle,
        addOns: props.addOns,
        tiers: props.tiers,
      }),
    [props.draft, props.vehicle, props.addOns, props.tiers],
  );

  return (
    <>
      <DesktopPanel {...props} price={price} />
      <MobilePanel {...props} price={price} />
    </>
  );
}

interface InnerProps extends FlowSummaryPanelProps {
  price: BookingPriceBreakdown;
}

function DesktopPanel({
  draft,
  vehicle,
  branches,
  addOns,
  tiers,
  primary,
  secondary,
  price,
}: InnerProps) {
  return (
    <aside
      aria-label="Booking summary"
      className={cn(
        "hidden flex-col lg:flex",
        // No shadow — INK & SIGNAL summary surfaces use a quiet 1px ink-15
        // border instead of borrowed elevation. Matches the SearchBar
        // compact pill treatment.
        "bg-paper border-ink-15 rounded-2xl border p-6",
        "duration-200",
      )}
    >
      <PanelContents
        draft={draft}
        vehicle={vehicle}
        branches={branches}
        addOns={addOns}
        tiers={tiers}
        price={price}
      />
      <Button
        variant="cta"
        size="lg"
        fullWidth
        onClick={primary.onClick}
        disabled={primary.disabled}
        className="mt-5"
      >
        {primary.label}
      </Button>
      {secondary ? <div className="mt-3">{secondary}</div> : null}
    </aside>
  );
}

function MobilePanel({
  draft,
  vehicle,
  branches,
  addOns,
  tiers,
  primary,
  secondary,
  price,
}: InnerProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="lg:hidden">
      <div
        className={cn(
          "bg-ink-100 text-paper fixed inset-x-0 bottom-0 z-30",
          "shadow-[var(--shadow-elevation-3)]",
          "pb-[max(0px,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mx-auto flex max-w-[var(--container-full)] items-center gap-3 px-4 py-3 sm:px-5">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "rounded-pill flex flex-1 items-center gap-2 px-5 py-2 text-left",
                  "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
                )}
              >
                <div className="flex flex-col">
                  <span className="label-sm text-ink-40">Total</span>
                  <span className="price-md text-paper">{formatUsd(price.totalCents)}</span>
                </div>
                <span className="label-lg text-paper ml-auto inline-flex items-center gap-1">
                  See details
                  <ChevronUp className="size-4" aria-hidden="true" />
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <SheetTitle>Booking summary</SheetTitle>
              <div className="mt-4">
                <PanelContents
                  draft={draft}
                  vehicle={vehicle}
                  branches={branches}
                  addOns={addOns}
                  tiers={tiers}
                  price={price}
                />
              </div>
              {secondary ? <div className="mt-3">{secondary}</div> : null}
            </SheetContent>
          </Sheet>
          <Button variant="cta" size="md" onClick={primary.onClick} disabled={primary.disabled}>
            {primary.label}
          </Button>
        </div>
      </div>
      {/* Spacer so the sticky bar doesn't cover content. */}
      <div aria-hidden="true" className="h-20" />
    </div>
  );
}

function PanelContents({
  draft,
  vehicle,
  branches,
  addOns,
  tiers,
  price,
}: {
  draft: BookingDraft;
  vehicle?: Vehicle;
  branches: Branch[];
  addOns: AddOn[];
  tiers: ProtectionTier[];
  price: BookingPriceBreakdown;
}) {
  const locale = useLocale();
  const days = rentalDays(draft.pickup.datetime, draft.return.datetime);
  const pickupBranch = branches.find((b) => b.id === draft.pickup.locationId);
  const returnBranch = branches.find((b) => b.id === draft.return.locationId);
  const tier = tiers.find((t) => t.id === draft.protectionTierId);
  const heroImage = vehicle?.images[0];

  const selectedExtras = draft.extras
    .map((e) => ({ extra: e, addOn: addOns.find((a) => a.id === e.addOnId) }))
    .filter((row) => row.addOn);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {heroImage ? (
          // Use the same dark gradient as VehicleCard so the small product
          // thumbnail reads as a continuation. `object-contain` (not cover)
          // keeps the full car visible — no top/bottom crop. Wider than tall
          // so a horizontal car silhouette has room.
          <div
            className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md"
            style={{ backgroundImage: "var(--gradient-card-dark)" }}
          >
            <Image
              src={heroImage.url}
              alt={heroImage.alt}
              fill
              sizes="96px"
              className="object-contain p-1"
            />
          </div>
        ) : (
          <div className="bg-ink-10 h-16 w-24 shrink-0 rounded-md" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <div className="headline-sm text-ink-95 truncate">
            {vehicle ? `${vehicle.make} ${vehicle.model}` : "No vehicle selected"}
          </div>
          {vehicle ? <div className="label-sm text-ink-60 italic">or similar</div> : null}
        </div>
      </div>

      <hr className="border-border" />

      <SummaryRow
        label="Pickup"
        value={
          <>
            {pickupBranch?.name ?? draft.pickup.address ?? "—"}
            <br />
            <span className="label-md text-ink-60">
              {safeFormat(draft.pickup.datetime, locale)}
            </span>
          </>
        }
      />
      <SummaryRow
        label="Return"
        value={
          <>
            {returnBranch?.name ?? draft.return.address ?? pickupBranch?.name ?? "—"}
            <br />
            <span className="label-md text-ink-60">
              {safeFormat(draft.return.datetime, locale)}
            </span>
          </>
        }
      />

      <EditSearchModal>
        <button
          type="button"
          className="label-lg text-ink-100 hover:text-ink-80 focus-visible:outline-ink-100 inline-flex items-center gap-1 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Edit3 className="size-3.5" aria-hidden="true" /> Edit search
        </button>
      </EditSearchModal>

      {vehicle && draft.vehicle ? (
        <>
          <hr className="border-border" />
          <SummaryRow
            label="Rate"
            value={
              <>
                {draft.vehicle.rate.type === "best-price" ? "Best Price" : "Flexible"} ·{""}
                {draft.vehicle.rate.mileage === "unlimited" ? "Unlimited km" : "200 km/day"}
              </>
            }
          />
        </>
      ) : null}

      {selectedExtras.length > 0 ? (
        <>
          <hr className="border-border" />
          <div>
            <h3 className="text-ink-50 mb-2 overline">Add-ons</h3>
            <ul className="flex flex-col gap-1.5">
              {selectedExtras.map(({ extra, addOn }) => (
                <li key={extra.addOnId} className="body-sm text-ink-80 flex items-center gap-2">
                  <span className="flex-1">
                    {extra.qty > 1 ? `${extra.qty} × ` : ""}
                    {addOn?.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      {tier ? (
        <>
          <hr className="border-border" />
          <SummaryRow
            label="Protection"
            value={
              <>
                {tier.name} {tier.perDayCents > 0 ? `· +${formatUsd(tier.perDayCents)}/day` : ""}
              </>
            }
          />
        </>
      ) : null}

      <hr className="border-border" />

      <div className="flex items-baseline justify-between">
        <span className="headline-xs text-ink-95">Total</span>
        <span className="price-lg text-ink-95 transition-all duration-200">
          {formatUsd(price.totalCents)}
        </span>
      </div>
      {days ? (
        <div className="body-sm text-ink-60">
          {days} {days === 1 ? "day" : "days"} · taxes & basic insurance included
        </div>
      ) : null}
      <PriceDetailsModal price={price} />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-ink-50 overline">{label}</span>
      <span className="body-sm text-ink-95">{value}</span>
    </div>
  );
}

function EditSearchModal({ children }: { children: React.ReactNode }) {
  return (
    <Modal>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>Edit your search</ModalTitle>
        <ModalDescription>
          Use the back arrow above to return to step 1 (Vehicle) and change your pickup or return.
          We&apos;ll keep your other selections.
        </ModalDescription>
        <div className="mt-5 flex justify-end">
          <Button asChild variant="primary">
            <a href="/book/select-vehicle">Back to vehicles</a>
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function PriceDetailsModal({ price }: { price: BookingPriceBreakdown }) {
  return (
    <Modal>
      <ModalTrigger asChild>
        <button
          type="button"
          className="label-lg text-ink-100 hover:text-ink-80 focus-visible:outline-ink-100 self-start rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Price details
        </button>
      </ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>Price details</ModalTitle>
        <dl className="body-sm text-ink-80 mt-4 flex flex-col gap-2">
          <PriceRow label="Base rate" value={price.baseRateCents} />
          {price.extrasCents > 0 ? <PriceRow label="Add-ons" value={price.extrasCents} /> : null}
          {price.protectionCents > 0 ? (
            <PriceRow label="Protection" value={price.protectionCents} />
          ) : null}
          {price.feesCents > 0 ? <PriceRow label="Fees" value={price.feesCents} /> : null}
          <PriceRow label="Taxes (11%)" value={price.taxesCents} />
          {price.discountCents > 0 ? (
            <PriceRow label="Promo discount" value={-price.discountCents} />
          ) : null}
          <hr className="border-border my-1" />
          <PriceRow label="Total" value={price.totalCents} bold />
          <PriceRow label="Refundable deposit at pickup" value={price.depositCents} muted />
        </dl>
      </ModalContent>
    </Modal>
  );
}

function PriceRow({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3",
        bold && "headline-xs text-ink-95",
        muted && "text-ink-60",
      )}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatUsd(Math.abs(value))}</dd>
    </div>
  );
}

function safeFormat(iso: string, locale: string): string {
  try {
    const d = parseISO(iso);
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-LB" : locale === "fr" ? "fr-FR" : "en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: locale !== "fr",
    }).format(d);
  } catch {
    return iso;
  }
}
