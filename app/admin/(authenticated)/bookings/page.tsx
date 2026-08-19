"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";
import type { AdminWebsiteBooking } from "@/lib/supabase/admin-bookings-repository";
import type { HoldCustomerType, HoldInventoryStatus } from "@/lib/supabase/vehicle-booking-holds-repository";

type BookingsResponse = {
  items: AdminWebsiteBooking[];
  counters: {
    total: number;
    account: number;
    guest: number;
    holding: number;
  };
};

type CustomerFilter = "all" | "account" | "guest";
type HoldFilter = "all" | "holding" | "not-holding";
type RangeFilter = "7" | "30" | "90" | "all";

const PAGE_SIZE = 20;

function bookedWithinDays(createdAt: string, days: number): boolean {
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return false;
  return created >= Date.now() - days * 24 * 60 * 60 * 1000;
}

function formatBeirut(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function customerLabel(type: HoldCustomerType): string {
  if (type === "account") return "Account";
  if (type === "guest") return "Guest";
  return "Unlinked";
}

function holdStatusLabel(status: HoldInventoryStatus | null): string {
  if (!status) return "No hold";
  if (status === "on-rent") return "On rent";
  if (status === "upcoming") return "Upcoming";
  return "Hold ended";
}

export default function AdminBookingsPage() {
  const [data, setData] = React.useState<BookingsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [customerFilter, setCustomerFilter] = React.useState<CustomerFilter>("all");
  const [holdFilter, setHoldFilter] = React.useState<HoldFilter>("all");
  const [rangeFilter, setRangeFilter] = React.useState<RangeFilter>("7");
  const [page, setPage] = React.useState(1);
  const [releasing, setReleasing] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", { cache: "no-store" });
      if (!res.ok) {
        const details = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(details.message ?? "Failed to load bookings.");
      }
      setData((await res.json()) as BookingsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const releaseHold = async (bookingReference: string) => {
    const confirmed = window.confirm(
      `Release hold ${bookingReference}? That car will count as available again on the website.`,
    );
    if (!confirmed) return;
    setReleasing(bookingReference);
    try {
      const res = await fetch("/api/admin/holds", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({ bookingReference }),
      });
      if (!res.ok) {
        const details = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(details.message ?? "Failed to release hold.");
      }
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to release hold.");
    } finally {
      setReleasing(null);
    }
  };

  const windowed = (data?.items ?? []).filter((item) =>
    rangeFilter === "all" ? true : bookedWithinDays(item.createdAt, Number(rangeFilter)),
  );
  const counters = {
    total: windowed.length,
    account: windowed.filter((item) => item.customerType === "account").length,
    guest: windowed.filter((item) => item.customerType === "guest").length,
    holding: windowed.filter((item) => item.reducingCount).length,
  };
  const rows = windowed.filter((item) => {
    if (customerFilter !== "all" && item.customerType !== customerFilter) return false;
    if (holdFilter === "holding" && !item.reducingCount) return false;
    if (holdFilter === "not-holding" && item.reducingCount) return false;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setFilter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <AdminPageShell
      eyebrow="Operations"
      title="Bookings"
      description="Every website booking — guest checkout and logged-in accounts. Release hold puts that vehicle back in the fleet listing."
      actions={
        <Button variant="tertiary" onClick={() => void refresh()}>
          <RefreshCcw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      }
    >
      {loading ? <p className="body-md text-ink-60">Loading bookings…</p> : null}
      {error ? <p className="body-md text-danger">{error}</p> : null}
      {data ? (
        <div className="flex flex-col gap-6">
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["Total", counters.total],
                ["Account", counters.account],
                ["Guest", counters.guest],
                ["Holding a car", counters.holding],
              ] as const
            ).map(([label, value]) => (
              <li key={label} className="bg-paper border-border rounded-lg border px-3 py-2">
                <p className="label-sm text-ink-60">{label}</p>
                <p className="headline-sm text-ink-100 mt-0.5">{value}</p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40">
              <Select
                size="sm"
                aria-label="Booked within"
                value={rangeFilter}
                onChange={(event) => {
                  const value = event.target.value as RangeFilter;
                  setFilter(setRangeFilter, value);
                }}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </Select>
            </div>
            <span className="bg-border mx-1 hidden w-px self-stretch sm:inline-block" aria-hidden="true" />
            {(
              [
                ["all", "All customers"],
                ["account", "Account"],
                ["guest", "Guest"],
              ] as const
            ).map(([id, label]) => (
              <Chip
                key={id}
                variant={customerFilter === id ? "selected" : "default"}
                onClick={() => setFilter(setCustomerFilter, id)}
              >
                {label}
              </Chip>
            ))}
            <span className="bg-border mx-1 hidden w-px self-stretch sm:inline-block" aria-hidden="true" />
            {(
              [
                ["all", "All holds"],
                ["holding", "Holding a car"],
                ["not-holding", "Not holding"],
              ] as const
            ).map(([id, label]) => (
              <Chip
                key={id}
                variant={holdFilter === id ? "selected" : "default"}
                onClick={() => setFilter(setHoldFilter, id)}
              >
                {label}
              </Chip>
            ))}
          </div>

          <AdminDataTable
            rows={pagedRows}
            rowKey={(row) => row.bookingReference}
            emptyState={
              <>
                <p className="headline-sm text-ink-100">No bookings in this view</p>
                <p className="body-sm text-ink-60">
                  Guest and account checkouts from the website will appear here.
                </p>
              </>
            }
            columns={[
              {
                header: "Booking",
                cell: (row) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium tracking-wide">{row.bookingReference}</span>
                    <span className="text-ink-60">
                      {row.wizardBookingId != null ? `Wizard #${row.wizardBookingId}` : "Website"}
                    </span>
                  </div>
                ),
                width: "11rem",
              },
              {
                header: "Customer",
                cell: (row) => (
                  <div className="flex flex-col gap-0.5">
                    <span>
                      {customerLabel(row.customerType)}
                      {row.customerName ? ` · ${row.customerName}` : ""}
                    </span>
                    <span className="text-ink-60">{row.email ?? "—"}</span>
                  </div>
                ),
                width: "16rem",
              },
              {
                header: "Vehicle",
                cell: (row) => (
                  <div className="flex flex-col gap-0.5">
                    <span>{row.vehicleName ?? "—"}</span>
                    <span className="text-ink-60">{row.frontendVehicleId ?? ""}</span>
                  </div>
                ),
                width: "12rem",
              },
              {
                header: "Booked",
                cell: (row) => formatBeirut(row.createdAt),
                width: "10rem",
                className: "whitespace-nowrap",
              },
              {
                header: "Pickup",
                cell: (row) => formatBeirut(row.pickupAt),
                width: "10rem",
                className: "whitespace-nowrap",
              },
              {
                header: "Return",
                cell: (row) => formatBeirut(row.returnAt),
                width: "10rem",
                className: "whitespace-nowrap",
              },
              {
                header: "State",
                cell: (row) => (
                  <div className="flex flex-col gap-0.5">
                    <span>{row.lifecycleState ?? "—"}</span>
                    {row.paymentStatus ? (
                      <span className="text-ink-60">{row.paymentStatus}</span>
                    ) : null}
                  </div>
                ),
                width: "10rem",
              },
              {
                header: "Fleet",
                cell: (row) => holdStatusLabel(row.holdStatus),
                width: "8rem",
              },
            ]}
            rowActions={(row) =>
              row.reducingCount ? (
                <Button
                  size="sm"
                  variant="tertiary"
                  loading={releasing === row.bookingReference}
                  onClick={() => void releaseHold(row.bookingReference)}
                >
                  Release hold
                </Button>
              ) : null
            }
          />
          {rows.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="body-sm text-ink-60">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)} of{" "}
                {rows.length}
              </p>
              {pageCount > 1 ? (
                <nav aria-label="Bookings pagination" className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="tertiary"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="label-md text-ink-60">
                    Page {currentPage} of {pageCount}
                  </span>
                  <Button
                    size="sm"
                    variant="tertiary"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next
                  </Button>
                </nav>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminPageShell>
  );
}
