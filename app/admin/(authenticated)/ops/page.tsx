"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "@/components/ui/Toast";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";

type OpsResponse = {
  paymentEvents: Array<Record<string, unknown>>;
  bookingTimeline: Array<Record<string, unknown>>;
  notificationOutbox: Array<Record<string, unknown>>;
  notificationLogs: Array<Record<string, unknown>>;
};

export default function AdminOpsPage() {
  const [data, setData] = React.useState<OpsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ops", { cache: "no-store" });
      if (!res.ok) {
        const details = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(details.message ?? "Failed to load ops data.");
      }
      setData((await res.json()) as OpsResponse);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load ops data.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const retryOutbox = async (id: string) => {
    const res = await fetch("/api/admin/ops/retry-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const details = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(details.message ?? "Failed to retry notification.");
    }
    await refresh();
  };

  return (
    <AdminPageShell
      eyebrow="Operations"
      title="Ops observability"
      description="Read payment, sync timeline, and notification outbox data."
      actions={
        <Button variant="tertiary" onClick={() => void refresh()}>
          <RefreshCcw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      }
    >
      {loading ? <p className="body-md text-ink-60">Loading ops metrics…</p> : null}
      {data ? (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="headline-sm text-ink-100">Payment events</h2>
            <AdminDataTable
              rows={data.paymentEvents}
              rowKey={(row) => String(row.id)}
              columns={[
                {
                  header: "Booking",
                  cell: (row) => String(row.booking_reference ?? "—"),
                  width: "20%",
                },
                { header: "Provider", cell: (row) => String(row.provider ?? "—"), width: "12%" },
                { header: "Status", cell: (row) => String(row.status ?? "—"), width: "14%" },
                {
                  header: "Amount",
                  cell: (row) => `${row.currency ?? "USD"} ${row.amount ?? "—"}`,
                },
              ]}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="headline-sm text-ink-100">Booking state timeline</h2>
            <AdminDataTable
              rows={data.bookingTimeline}
              rowKey={(row) => String(row.id)}
              columns={[
                {
                  header: "Booking",
                  cell: (row) => String(row.booking_reference ?? "—"),
                  width: "20%",
                },
                { header: "State", cell: (row) => String(row.state ?? "—"), width: "16%" },
                { header: "Source", cell: (row) => String(row.source ?? "—"), width: "16%" },
                {
                  header: "Created",
                  cell: (row) =>
                    String(row.created_at ?? "—")
                      .slice(0, 19)
                      .replace("T", " "),
                },
              ]}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="headline-sm text-ink-100">Notification outbox</h2>
            <AdminDataTable
              rows={data.notificationOutbox}
              rowKey={(row) => String(row.id)}
              columns={[
                {
                  header: "Booking",
                  cell: (row) => String(row.booking_reference ?? "—"),
                  width: "20%",
                },
                { header: "Channel", cell: (row) => String(row.channel ?? "—"), width: "12%" },
                { header: "Template", cell: (row) => String(row.template ?? "—"), width: "20%" },
                { header: "Status", cell: (row) => String(row.status ?? "—"), width: "12%" },
                { header: "Attempts", cell: (row) => String(row.attempt_count ?? 0), width: "8%" },
              ]}
              rowActions={(row) =>
                row.status === "failed" ? (
                  <Button
                    size="sm"
                    variant="tertiary"
                    onClick={() =>
                      retryOutbox(String(row.id))
                        .then(() => toast.success("Notification retried."))
                        .catch((err) =>
                          toast.error(err instanceof Error ? err.message : "Retry failed."),
                        )
                    }
                  >
                    Retry
                  </Button>
                ) : null
              }
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="headline-sm text-ink-100">Notification logs</h2>
            <AdminDataTable
              rows={data.notificationLogs}
              rowKey={(row) => String(row.id)}
              columns={[
                {
                  header: "Booking",
                  cell: (row) => String(row.booking_reference ?? "—"),
                  width: "20%",
                },
                { header: "Channel", cell: (row) => String(row.channel ?? "—"), width: "12%" },
                { header: "Status", cell: (row) => String(row.status ?? "—"), width: "12%" },
                { header: "Error", cell: (row) => String(row.error_message ?? "—") },
              ]}
            />
          </section>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
