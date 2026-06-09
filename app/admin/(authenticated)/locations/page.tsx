"use client";

import * as React from "react";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import type { Branch, BranchHours } from "@/types/domain";

/**
 * /admin/locations — structured editor for branch records.
 *
 * Replaces the raw-JSON textarea with per-branch cards. Branch copy is not
 * localized, so there is no locale selector. Load/save still use
 * GET/PUT /api/admin/locations with the same { items: Branch[] } payload.
 */

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function AdminLocationsPage() {
  const [items, setItems] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/locations", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to load locations.");
      }
      const data = (await res.json()) as { items: Branch[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateBranch = (index: number, patch: Partial<Branch>) =>
    setItems((list) => list.map((b, i) => (i === index ? { ...b, ...patch } : b)));

  const addBranch = () =>
    setItems((list) => [
      ...list,
      {
        id: `loc-${Date.now().toString(36).slice(-6)}`,
        slug: "",
        name: "",
        address: "",
        city: "",
        lat: 0,
        lng: 0,
        phone: "",
        whatsapp: "",
        hours: [],
        isAirport: false,
      },
    ]);

  const removeBranch = (index: number) => {
    if (!confirm("Remove this branch?")) return;
    setItems((list) => list.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = items.map((b) => ({
        ...b,
        whatsapp: b.whatsapp?.trim() ? b.whatsapp.trim() : undefined,
        closedReason: b.closedReason?.trim() ? b.closedReason.trim() : undefined,
      }));
      const res = await fetch("/api/admin/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to save locations.");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save locations.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Locations"
      title="Branch locations"
      description="Manage website-owned branch records used by /locations and search."
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

      {items.length === 0 && !loading ? (
        <p className="body-md text-ink-60 mb-4">No branches yet. Add one to get started.</p>
      ) : null}

      <div className="flex flex-col gap-6">
        {items.map((branch, i) => (
          <AdminFormShell key={branch.id} title={branch.name.trim() || "New branch"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                {({ id }) => (
                  <Input
                    id={id}
                    value={branch.name}
                    onChange={(e) => updateBranch(i, { name: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Slug" required helper="Lowercase, dashes, no spaces.">
                {({ id }) => (
                  <Input
                    id={id}
                    value={branch.slug}
                    onChange={(e) => updateBranch(i, { slug: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Address" required className="sm:col-span-2">
                {({ id }) => (
                  <Input
                    id={id}
                    value={branch.address}
                    onChange={(e) => updateBranch(i, { address: e.target.value })}
                  />
                )}
              </Field>
              <Field label="City" required>
                {({ id }) => (
                  <Input
                    id={id}
                    value={branch.city}
                    onChange={(e) => updateBranch(i, { city: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Phone" required>
                {({ id }) => (
                  <Input
                    id={id}
                    value={branch.phone}
                    onChange={(e) => updateBranch(i, { phone: e.target.value })}
                  />
                )}
              </Field>
              <Field label="WhatsApp" helper="Optional.">
                {({ id }) => (
                  <Input
                    id={id}
                    value={branch.whatsapp ?? ""}
                    onChange={(e) => updateBranch(i, { whatsapp: e.target.value })}
                  />
                )}
              </Field>
              <div />
              <Field label="Latitude" helper="Decimal degrees.">
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    step="any"
                    value={String(branch.lat)}
                    onChange={(e) => updateBranch(i, { lat: Number(e.target.value) })}
                  />
                )}
              </Field>
              <Field label="Longitude" helper="Decimal degrees.">
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    step="any"
                    value={String(branch.lng)}
                    onChange={(e) => updateBranch(i, { lng: Number(e.target.value) })}
                  />
                )}
              </Field>
            </div>

            <div className="flex flex-col gap-3">
              <Checkbox
                checked={branch.isAirport}
                onCheckedChange={(c) => updateBranch(i, { isAirport: c === true })}
                label="Airport desk (BEY)"
              />
              <Checkbox
                checked={Boolean(branch.temporarilyClosed)}
                onCheckedChange={(c) => updateBranch(i, { temporarilyClosed: c === true })}
                label="Temporarily closed"
              />
              {branch.temporarilyClosed ? (
                <Field label="Closed reason" helper="Shown to visitors while closed.">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={branch.closedReason ?? ""}
                      onChange={(e) => updateBranch(i, { closedReason: e.target.value })}
                    />
                  )}
                </Field>
              ) : null}
            </div>

            <HoursEditor
              hours={branch.hours}
              onChange={(next) => updateBranch(i, { hours: next })}
            />

            <div className="border-border flex justify-end border-t pt-4">
              <Button type="button" variant="tertiary" onClick={() => removeBranch(i)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Remove this branch
              </Button>
            </div>
          </AdminFormShell>
        ))}

        <div>
          <Button variant="secondary" onClick={addBranch}>
            <Plus className="size-4" aria-hidden="true" />
            Add branch
          </Button>
        </div>
      </div>
    </AdminPageShell>
  );
}

function HoursEditor({
  hours,
  onChange,
}: {
  hours: BranchHours[];
  onChange: (next: BranchHours[]) => void;
}) {
  const update = (index: number, patch: Partial<BranchHours>) =>
    onChange(hours.map((h, i) => (i === index ? { ...h, ...patch } : h)));

  return (
    <div>
      <p className="label-md text-ink-70 mb-2 block">Opening hours</p>
      <div className="flex flex-col gap-2">
        {hours.map((row, i) => (
          <div
            key={i}
            className="border-border grid items-end gap-2 rounded-lg border p-3 sm:grid-cols-[1.4fr_1fr_1fr_auto_auto]"
          >
            <Field label="Day">
              {({ id }) => (
                <Select
                  id={id}
                  value={String(row.day)}
                  onChange={(e) => update(i, { day: Number(e.target.value) })}
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Open">
              {({ id }) => (
                <Input
                  id={id}
                  type="time"
                  value={row.open}
                  disabled={row.open24h}
                  onChange={(e) => update(i, { open: e.target.value })}
                />
              )}
            </Field>
            <Field label="Close">
              {({ id }) => (
                <Input
                  id={id}
                  type="time"
                  value={row.close}
                  disabled={row.open24h}
                  onChange={(e) => update(i, { close: e.target.value })}
                />
              )}
            </Field>
            <div className="flex items-center pb-3">
              <Checkbox
                checked={Boolean(row.open24h)}
                onCheckedChange={(c) => update(i, { open24h: c === true })}
                label="24h"
              />
            </div>
            <div className="flex items-center pb-1">
              <Button
                type="button"
                variant="tertiary"
                onClick={() => onChange(hours.filter((_, idx) => idx !== i))}
                aria-label="Remove hours row"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChange([...hours, { day: 1, open: "09:00", close: "18:00" }])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add hours row
          </Button>
        </div>
      </div>
    </div>
  );
}

function csrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return {};
  return { "x-admin-csrf": decodeURIComponent(match[1] ?? "") };
}
