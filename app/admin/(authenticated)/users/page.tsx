"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { DocumentScanPreview } from "@/components/account/DocumentScanPreview";
import { formatUsd } from "@/lib/booking/pricing";
import type { User, UserDocument } from "@/types/domain";

/**
 * /admin/users — every customer account (paginated via Supabase Auth's own
 * page/perPage, not the fetch-everything-then-slice pattern other admin
 * list pages use — see app/api/admin/users/route.ts for why).
 *
 * Expanding a row lazy-loads that one account's bookings, saved vehicles,
 * and uploaded documents from /api/admin/users/[id] — not fetched upfront
 * for the whole page, since most rows never get expanded.
 */

const PER_PAGE = 20;

type UsersResponse = {
  items: User[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
};

type BookingRow = {
  bookingReference: string;
  state: string | null;
  pickupAt: string | null;
  returnAt: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  totalCents: number | null;
};

type SavedVehicleRow = { vehicleId: string; createdAt: string };

type UserDetail = {
  bookings: BookingRow[];
  savedVehicles: SavedVehicleRow[];
  documents: UserDocument[];
};

async function readJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Failed to load ${path}`);
  }
  return (await res.json()) as T;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export default function AdminUsersPage() {
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<UsersResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState("");
  const [details, setDetails] = React.useState<Record<string, UserDetail>>({});
  const [detailError, setDetailError] = React.useState<Record<string, string>>({});
  const [detailLoading, setDetailLoading] = React.useState<Record<string, boolean>>({});

  const load = React.useCallback((targetPage: number) => {
    setLoading(true);
    setError(null);
    readJson<UsersResponse>(`/api/admin/users?page=${targetPage}&perPage=${PER_PAGE}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load accounts."))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load(page);
  }, [load, page]);

  const onExpand = (value: string) => {
    setExpanded(value);
    if (!value || details[value] || detailLoading[value]) return;
    setDetailLoading((prev) => ({ ...prev, [value]: true }));
    setDetailError((prev) => ({ ...prev, [value]: "" }));
    readJson<{ bookings: BookingRow[]; savedVehicles: SavedVehicleRow[]; documents: UserDocument[] }>(
      `/api/admin/users/${value}`,
    )
      .then((res) =>
        setDetails((prev) => ({
          ...prev,
          [value]: { bookings: res.bookings, savedVehicles: res.savedVehicles, documents: res.documents },
        })),
      )
      .catch((err) =>
        setDetailError((prev) => ({
          ...prev,
          [value]: err instanceof Error ? err.message : "Failed to load account details.",
        })),
      )
      .finally(() => setDetailLoading((prev) => ({ ...prev, [value]: false })));
  };

  return (
    <AdminPageShell
      eyebrow="Accounts"
      title="Users"
      description="Every registered customer account, and everything they've saved to their profile."
    >
      {error ? <p className="body-md text-danger mb-4">{error}</p> : null}

      {loading && !data ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="bg-paper border-border flex flex-col items-center gap-2 rounded-xl border p-12 text-center">
          <p className="body-md text-ink-60">No accounts yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-paper border-border rounded-xl border">
            <div className="border-border text-ink-60 label-md hidden grid-cols-[2fr_2fr_1.2fr_1fr_1fr] gap-3 border-b px-4 py-3 font-medium tracking-wider uppercase sm:grid">
              <span>Name</span>
              <span>Email</span>
              <span>Phone</span>
              <span>Verified</span>
              <span>Joined</span>
            </div>
            <Accordion type="single" collapsible value={expanded} onValueChange={onExpand}>
              {data.items.map((user) => (
                <AccordionItem key={user.id} value={user.id} className="px-4">
                  <AccordionTrigger
                    hideChevron
                    className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[2fr_2fr_1.2fr_1fr_1fr] sm:items-center sm:gap-3"
                  >
                    <span className="headline-xs text-ink-95">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                    </span>
                    <span className="body-sm text-ink-70 truncate">{user.email}</span>
                    <span className="body-sm text-ink-70">{user.phone || "—"}</span>
                    <span className="body-sm text-ink-70">
                      {user.emailVerified ? (
                        <CheckCircle2 className="text-success size-4" aria-label="Verified" />
                      ) : (
                        <XCircle className="text-ink-40 size-4" aria-label="Not verified" />
                      )}
                    </span>
                    <span className="body-sm text-ink-70">{formatDate(user.createdAt)}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <UserDetailPanel
                      user={user}
                      detail={details[user.id]}
                      loading={Boolean(detailLoading[user.id])}
                      error={detailError[user.id]}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="body-sm text-ink-60">
              Page {data.page} of {Math.max(1, data.lastPage)} · {data.total} accounts
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.lastPage || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </AdminPageShell>
  );
}

function UserDetailPanel({
  user,
  detail,
  loading,
  error,
}: {
  user: User;
  detail?: UserDetail;
  loading: boolean;
  error?: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
    );
  }
  if (error) {
    return <p className="body-sm text-danger">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="label-md text-ink-60 mb-2 tracking-wider uppercase">Profile</h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-3">
          <Field label="User ID" value={user.id} mono />
          <Field label="First name" value={user.firstName || "—"} />
          <Field label="Last name" value={user.lastName || "—"} />
          <Field label="Email" value={user.email} />
          <Field label="Email verified" value={user.emailVerified ? "Yes" : "No"} />
          <Field label="Phone" value={user.phone || "—"} />
          <Field label="Date of birth" value={user.dob || "—"} />
          <Field label="Country" value={user.country || "—"} />
          <Field label="Marketing opt-in" value={user.preferences.marketing ? "Yes" : "No"} />
          <Field label="WhatsApp opt-in" value={user.preferences.whatsappUpdates ? "Yes" : "No"} />
          <Field label="Account created" value={formatDate(user.createdAt)} />
        </dl>
      </section>

      {!detail ? null : (
        <>
          <section>
            <h3 className="label-md text-ink-60 mb-2 tracking-wider uppercase">
              Bookings ({detail.bookings.length})
            </h3>
            {detail.bookings.length === 0 ? (
              <p className="body-sm text-ink-50">No bookings.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {detail.bookings.map((b) => (
                  <div
                    key={b.bookingReference}
                    className="bg-ink-05 flex flex-col gap-1 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="label-md text-ink-95">{b.bookingReference}</span>
                      <span className="body-sm text-ink-60">
                        {[b.vehicleMake, b.vehicleModel].filter(Boolean).join(" ") || "Vehicle unknown"}
                        {" · "}
                        {formatDate(b.pickupAt)} → {formatDate(b.returnAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="body-sm text-ink-70 capitalize">{b.state ?? "unknown"}</span>
                      <span className="label-md text-ink-95">
                        {b.totalCents != null ? formatUsd(b.totalCents) : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="label-md text-ink-60 mb-2 tracking-wider uppercase">
              Saved vehicles ({detail.savedVehicles.length})
            </h3>
            {detail.savedVehicles.length === 0 ? (
              <p className="body-sm text-ink-50">None saved.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {detail.savedVehicles.map((v) => (
                  <li key={v.vehicleId} className="body-sm text-ink-80">
                    {v.vehicleId} — saved {formatDate(v.createdAt)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="label-md text-ink-60 mb-2 tracking-wider uppercase">
              Documents ({detail.documents.length})
            </h3>
            {detail.documents.length === 0 ? (
              <p className="body-sm text-ink-50">No documents uploaded.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {detail.documents.map((doc) => (
                  <div key={doc.id} className="flex flex-col gap-2">
                    <span className="label-md text-ink-95 capitalize">
                      {doc.type} — {doc.number || "no number"} ({doc.status})
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {doc.scanFrontUrl ? (
                        <DocumentScanPreview scanUrl={doc.scanFrontUrl} alt={`${doc.type} front`} size="md" />
                      ) : null}
                      {doc.scanBackUrl ? (
                        <DocumentScanPreview scanUrl={doc.scanBackUrl} alt={`${doc.type} back`} size="md" />
                      ) : null}
                      {!doc.scanFrontUrl && !doc.scanBackUrl && doc.scanUrl ? (
                        <DocumentScanPreview scanUrl={doc.scanUrl} alt={doc.type} size="md" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-1">
      <dt className="label-sm text-ink-50">{label}</dt>
      <dd className={`body-sm text-ink-90 ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
