"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { BookingDetailPanel } from "@/components/account/BookingDetailPanel";
import { DocumentScanPreview } from "@/components/account/DocumentScanPreview";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";
import { ADD_ONS } from "@/lib/api/fixtures/catalog";
import type { AdminBookingDetail } from "@/lib/supabase/admin-bookings-repository";
import type { HoldCustomerType, HoldInventoryStatus } from "@/lib/supabase/vehicle-booking-holds-repository";

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

function rateLabel(type: string, mileage: string): string {
  const rate = type === "flexible" ? "Flexible" : "Best price";
  const plan = mileage === "unlimited" ? "Unlimited km" : "200 km/day";
  return `${rate} · ${plan}`;
}

export default function AdminBookingDetailPage() {
  const params = useParams<{ ref: string }>();
  const router = useRouter();
  const ref = decodeURIComponent(params?.ref ?? "");
  const [detail, setDetail] = React.useState<AdminBookingDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState<"confirm" | "cancel" | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${encodeURIComponent(ref)}`, { cache: "no-store" });
      if (res.status === 404) {
        setDetail(null);
        setError("Booking not found.");
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Failed to load booking.");
      }
      setDetail((await res.json()) as AdminBookingDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking.");
    }
  }, [ref]);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!ref) return;
    void load();
  }, [ref, load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const runManualAction = async (action: "confirm" | "cancel") => {
    const confirmed = window.confirm(
      action === "confirm"
        ? `Confirm ${ref}? The customer will get the same confirmation email as a Wizard approval.`
        : `Cancel ${ref}? The customer will be emailed and the fleet hold will be released.`,
    );
    if (!confirmed) return;
    setActing(action);
    try {
      const res = await fetch("/api/admin/bookings/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({ bookingReference: ref, action }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Failed to ${action} booking.`);
      }
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} booking.`);
    } finally {
      setActing(null);
    }
  };

  if (error && !detail) {
    return (
      <AdminPageShell
        eyebrow="Operations"
        title={ref || "Booking"}
        description={error}
        backHref="/admin/bookings"
        backLabel="Back to bookings"
      >
        <Button variant="secondary" onClick={() => router.push("/admin/bookings")}>
          Back to bookings
        </Button>
      </AdminPageShell>
    );
  }

  if (!detail) {
    return (
      <AdminPageShell
        eyebrow="Operations"
        title={ref || "Booking"}
        backHref="/admin/bookings"
        backLabel="Back to bookings"
      >
        <p className="body-md text-ink-60">Loading booking…</p>
      </AdminPageShell>
    );
  }

  const { booking } = detail;
  const terminal = detail.lifecycleState === "cancelled" || detail.lifecycleState === "completed";
  const confirmed = detail.lifecycleState === "confirmed";
  const extrasLabel =
    booking.extras.length === 0
      ? "None"
      : booking.extras
        .map((extra) => {
          const name = ADD_ONS.find((a) => a.id === extra.addOnId)?.name ?? extra.addOnId;
          return extra.qty > 1 ? `${extra.qty} × ${name}` : name;
        })
        .join(", ");

  return (
    <AdminPageShell
      eyebrow="Operations"
      title={booking.ref}
      description={
        detail.wizardBookingId != null
          ? `Wizard #${detail.wizardBookingId}`
          : detail.isManual
            ? "Website-only booking"
            : "Website booking"
      }
      backHref="/admin/bookings"
      backLabel="Back to bookings"
      actions={
        detail.isManual && detail.reducingCount && !terminal ? (
          <div className="flex flex-wrap gap-2">
            {!confirmed ? (
              <Button
                variant="secondary"
                loading={acting === "confirm"}
                disabled={acting != null}
                onClick={() => void runManualAction("confirm")}
              >
                Confirm
              </Button>
            ) : null}
            <Button
              variant="tertiary"
              loading={acting === "cancel"}
              disabled={acting != null}
              onClick={() => void runManualAction("cancel")}
            >
              Cancel
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <BookingDetailPanel booking={booking} />
          {detail.licenceFrontUrl || detail.licenceBackUrl ? (
            <section className="bg-paper border-border flex flex-col gap-3 rounded-xl border p-5">
              <h2 className="headline-xs text-ink-100">Main Driver licence scans</h2>
              <div className="flex flex-wrap gap-3">
                {detail.licenceFrontUrl ? (
                  <DocumentScanPreview
                    scanUrl={detail.licenceFrontUrl}
                    alt="Front of driver's licence"
                    size="md"
                  />
                ) : null}
                {detail.licenceBackUrl ? (
                  <DocumentScanPreview
                    scanUrl={detail.licenceBackUrl}
                    alt="Back of driver's licence"
                    size="md"
                  />
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="bg-paper border-border flex h-fit flex-col gap-4 rounded-xl border p-5">
          <h2 className="headline-xs text-ink-100">Ops</h2>
          <Dl
            items={[
              ["Customer", customerLabel(detail.customerType)],
              ["Email", detail.email ?? "—"],
              ["Phone", booking.driver.phone || "—"],
              ["DOB", booking.driver.dob || "—"],
              ["Country", booking.driver.country || "—"],
              ["Additional driver", detail.additionalDriverName || "—"],
              ["Vehicle", detail.vehicleName ?? "—"],
              ["Fleet id", detail.frontendVehicleId ?? "—"],
              ["Rate", rateLabel(booking.vehicle.rate.type, booking.vehicle.rate.mileage)],
              ["Add-ons", extrasLabel],
              ["Payment", booking.paymentMethod || "—"],
              ["State", detail.lifecycleState ?? booking.state],
              ["Payment event", detail.paymentStatus ?? "—"],
              ["Fleet hold", holdStatusLabel(detail.holdStatus)],
              ["Promo", booking.promoCode ?? "—"],
              ["Flight", booking.flightNumber ?? "—"],
            ]}
          />
        </aside>
      </div>
    </AdminPageShell>
  );
}

function Dl({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="flex flex-col gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="label-sm text-ink-60">{label}</dt>
          <dd className="body-sm text-ink-100 break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
