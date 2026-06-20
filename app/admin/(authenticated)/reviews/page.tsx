"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { fetchAdminReviews, writeAdminReviews } from "@/lib/admin/catalog-store";
import type { Review } from "@/types/domain";

/** /admin/reviews — homepage reviews marquee. */
export default function AdminReviewsPage() {
  const [items, setItems] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAdminReviews());
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const update = (index: number, patch: Partial<Review>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await writeAdminReviews(items);
      setDirty(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reviews.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Marketing"
      title="Reviews"
      description="Customer quotes in the homepage reviews marquee. Order follows list top to bottom."
      actions={
        <>
          <Button variant="tertiary" onClick={() => void load()} disabled={loading || saving}>
            Reload
          </Button>
          <Button variant="primary" onClick={() => void save()} loading={saving} disabled={!dirty}>
            {dirty ? "Save changes" : "Saved"}
          </Button>
        </>
      }
    >
      {error ? <p className="body-md text-danger mb-4">{error}</p> : null}
      {loading ? (
        <p className="body-md text-ink-60">Loading reviews…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <AdminFormShell key={item.id} title={item.author || "Untitled review"}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="ID">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={item.id}
                      onChange={(e) => update(index, { id: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Source">
                  {({ id }) => (
                    <Select
                      id={id}
                      value={item.source}
                      onChange={(e) =>
                        update(index, { source: e.target.value as Review["source"] })
                      }
                    >
                      <option value="google">Google</option>
                      <option value="trustpilot">Trustpilot</option>
                    </Select>
                  )}
                </Field>
                <Field label="Author">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={item.author}
                      onChange={(e) => update(index, { author: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Rating (1–5)">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      min={1}
                      max={5}
                      value={item.rating}
                      onChange={(e) => update(index, { rating: Number(e.target.value) })}
                    />
                  )}
                </Field>
                <Field label="Date (YYYY-MM-DD)">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="date"
                      value={item.date}
                      onChange={(e) => update(index, { date: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Quote" className="sm:col-span-2">
                  {({ id }) => (
                    <Textarea
                      id={id}
                      rows={3}
                      value={item.body}
                      onChange={(e) => update(index, { body: e.target.value })}
                    />
                  )}
                </Field>
              </div>
              <div className="border-border flex justify-end border-t pt-4">
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => {
                    if (!confirm("Remove this review?")) return;
                    setItems((prev) => prev.filter((_, i) => i !== index));
                    setDirty(true);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </AdminFormShell>
          ))}
          <Button
            variant="secondary"
            onClick={() => {
              setItems((prev) => [
                ...prev,
                {
                  id: `rev-${prev.length + 1}`,
                  source: "google",
                  rating: 5,
                  author: "Guest",
                  body: "",
                  date: new Date().toISOString().slice(0, 10),
                },
              ]);
              setDirty(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add review
          </Button>
        </div>
      )}
    </AdminPageShell>
  );
}
