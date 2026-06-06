"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type Promotion = {
  id: string;
  message: string;
  href: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export default function AdminPromotionsPage() {
  const [items, setItems] = React.useState<Promotion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promotions", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to load promotions.");
      }
      const data = (await res.json()) as { items: Promotion[] };
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load promotions.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to save promotions.");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save promotions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Promotions"
      title="Promo campaigns"
      description="Control promo strip content and campaign windows."
      actions={
        <>
          <Button variant="tertiary" onClick={() => void refresh()}>
            <RefreshCcw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button onClick={() => void save()} loading={saving} disabled={loading}>
            Save
          </Button>
        </>
      }
    >
      {error ? <p className="body-md text-danger mb-4">{error}</p> : null}
      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <section key={item.id} className="bg-paper border-border rounded-xl border p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="body-sm text-ink-60 flex flex-col gap-1.5">
                Campaign id
                <input
                  className="border-border rounded-pill h-10 border px-3"
                  value={item.id}
                  onChange={(e) => updateItem(setItems, index, { ...item, id: e.target.value })}
                />
              </label>
              <label className="body-sm text-ink-60 flex flex-col gap-1.5">
                Href
                <input
                  className="border-border rounded-pill h-10 border px-3"
                  value={item.href ?? ""}
                  onChange={(e) =>
                    updateItem(setItems, index, { ...item, href: e.target.value || null })
                  }
                />
              </label>
              <label className="body-sm text-ink-60 flex flex-col gap-1.5 md:col-span-2">
                Message
                <input
                  className="border-border rounded-pill h-10 border px-3"
                  value={item.message}
                  onChange={(e) =>
                    updateItem(setItems, index, { ...item, message: e.target.value })
                  }
                />
              </label>
              <label className="body-sm text-ink-60 flex flex-col gap-1.5">
                Starts at (ISO)
                <input
                  className="border-border rounded-pill h-10 border px-3"
                  value={item.starts_at ?? ""}
                  onChange={(e) =>
                    updateItem(setItems, index, { ...item, starts_at: e.target.value || null })
                  }
                />
              </label>
              <label className="body-sm text-ink-60 flex flex-col gap-1.5">
                Ends at (ISO)
                <input
                  className="border-border rounded-pill h-10 border px-3"
                  value={item.ends_at ?? ""}
                  onChange={(e) =>
                    updateItem(setItems, index, { ...item, ends_at: e.target.value || null })
                  }
                />
              </label>
              <label className="label-md text-ink-80 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={(e) =>
                    updateItem(setItems, index, { ...item, active: e.target.checked })
                  }
                />
                Active
              </label>
            </div>
          </section>
        ))}
        <Button
          variant="tertiary"
          onClick={() =>
            setItems((prev) => [
              ...prev,
              {
                id: `promo-${prev.length + 1}`,
                message: "",
                href: null,
                active: true,
                starts_at: null,
                ends_at: null,
              },
            ])
          }
        >
          Add campaign
        </Button>
      </div>
    </AdminPageShell>
  );
}

function updateItem(
  setter: React.Dispatch<React.SetStateAction<Promotion[]>>,
  index: number,
  next: Promotion,
) {
  setter((prev) => prev.map((item, i) => (i === index ? next : item)));
}

function csrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return {};
  return { "x-admin-csrf": decodeURIComponent(match[1] ?? "") };
}
