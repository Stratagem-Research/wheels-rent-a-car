"use client";

import * as React from "react";
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { BookingHistoryRow } from "@/components/account/BookingHistoryRow";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Booking, BookingState } from "@/types/domain";

type Filter = "all" | "upcoming" | "pending" | "completed" | "cancelled";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const PER_PAGE = 10;

export default function BookingsPage() {
  const [bookings, setBookings] = React.useState<Booking[] | null>(null);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ items: Booking[] }>(endpoints.accountBookings);
        if (!cancelled) setBookings(res.items);
      } catch {
        if (!cancelled) setBookings([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Snapshot via lazy state init so Date.now() doesn't shift across renders.
  const [now] = React.useState(() => Date.now());

  const filtered = React.useMemo(() => {
    if (!bookings) return [];
    switch (filter) {
      case "upcoming":
        return bookings.filter(
          (b) =>
            (b.state === "confirmed" || b.state === "pending") &&
            new Date(b.pickup.datetime).getTime() > now,
        );
      case "pending":
        return bookings.filter((b) => b.state === "pending");
      case "completed":
        return bookings.filter((b) => b.state === "completed");
      case "cancelled":
        return bookings.filter((b) => b.state === "cancelled" || b.state === "expired");
      case "all":
      default:
        return bookings;
    }
  }, [bookings, filter, now]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-ink-60 overline">Bookings</p>
        <h1 className="headline-xl text-ink-100">My bookings</h1>
        <p className="lead-md text-ink-60">Filter by status to focus the list.</p>
      </header>

      <ul className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <li key={f.id}>
            <Chip
              variant={filter === f.id ? "selected" : "default"}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
            >
              {f.label} {filter === f.id ? null : <CountFor bookings={bookings} filter={f.id} />}
            </Chip>
          </li>
        ))}
      </ul>

      {bookings === null ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty filter={filter} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {slice.map((b) => (
              <li key={b.ref}>
                <BookingHistoryRow booking={b} />
              </li>
            ))}
          </ul>
          {totalPages > 1 ? (
            <Pagination current={page} total={totalPages} onChange={setPage} />
          ) : null}
        </>
      )}
    </div>
  );
}

function CountFor({ bookings, filter }: { bookings: Booking[] | null; filter: Filter }) {
  const [now] = React.useState(() => Date.now());
  if (!bookings) return null;
  const count = bookings.filter((b) => {
    switch (filter) {
      case "upcoming":
        return (
          (b.state === "confirmed" || b.state === "pending") &&
          new Date(b.pickup.datetime).getTime() > now
        );
      case "pending":
        return b.state === "pending";
      case "completed":
        return b.state === "completed";
      case "cancelled":
        return b.state === "cancelled" || (b.state as BookingState) === "expired";
      case "all":
      default:
        return true;
    }
  }).length;
  return <span className="label-sm text-ink-50 ml-1">({count})</span>;
}

function Empty({ filter }: { filter: Filter }) {
  return (
    <div className="bg-ink-10 flex flex-col items-center gap-4 rounded-xl p-14 text-center">
      <span aria-hidden="true" className="text-5xl">
        📭
      </span>
      <h2 className="headline-md text-ink-100">
        {filter === "all" ? "No bookings yet." : `No ${filter} bookings.`}
      </h2>
      <Link
        href="/vehicles"
        className="label-lg text-ink-100 hover:text-ink-80 mt-2 underline-offset-4 hover:underline"
      >
        Browse cars →
      </Link>
    </div>
  );
}

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav aria-label="Pagination" className="mt-2 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
        className="label-md text-ink-80 hover:bg-ink-10 rounded-pill px-4 py-2 disabled:opacity-40"
      >
        Prev
      </button>
      <span className="label-md text-ink-50">
        Page {current} of {total}
      </span>
      <button
        type="button"
        disabled={current >= total}
        onClick={() => onChange(current + 1)}
        className="label-md text-ink-80 hover:bg-ink-10 rounded-pill px-4 py-2 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
