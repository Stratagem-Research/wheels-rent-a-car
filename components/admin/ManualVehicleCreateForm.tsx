"use client";

import * as React from "react";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { VehicleOperationalFields } from "@/components/admin/VehicleOperationalFields";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { normalizeManualUnitId } from "@/lib/booking/wizard-vehicle-id";
import {
  emptyOperational,
  normalizeOperational,
  type VehicleOperational,
} from "@/lib/vehicles/vehicle-operational";

export type ManualCreateValues = {
  unitIds: string[];
  brand: string;
  model: string;
  operational: VehicleOperational;
};

function resizeUnitIds(ids: string[], count: number): string[] {
  const next = ids.slice(0, count);
  while (next.length < count) next.push("");
  return next;
}

export function ManualVehicleCreateForm({
  onCancel,
  onCreate,
  takenIds = [],
}: {
  onCancel: () => void;
  onCreate: (values: ManualCreateValues) => void;
  takenIds?: string[];
}) {
  const [brand, setBrand] = React.useState("");
  const [model, setModel] = React.useState("");
  const [unitIds, setUnitIds] = React.useState<string[]>([""]);
  const [operational, setOperational] = React.useState<VehicleOperational>(() => ({
    ...emptyOperational(),
    year: null,
    daily_rate: null,
    standard_price: null,
  }));
  const [error, setError] = React.useState<string | null>(null);

  const units = unitIds.length;
  const idsReady = unitIds.length > 0 && unitIds.every((id) => Boolean(normalizeManualUnitId(id)));
  const specsReady = Boolean(
    operational.year && operational.year > 1900 && operational.daily_rate != null && operational.daily_rate > 0,
  );
  const canAdd = Boolean(brand.trim() && model.trim() && idsReady && specsReady);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) return;
    const fallbackName = `${brand.trim()} ${model.trim()}`;
    const ids: string[] = [];
    for (const raw of unitIds) {
      const id = normalizeManualUnitId(raw);
      if (!id) {
        setError(
          "Each unit needs its own id. Letters, numbers, dots, dashes, and underscores only — not a Wizard id.",
        );
        return;
      }
      ids.push(id);
    }
    if (new Set(ids).size !== ids.length) {
      setError("Unit ids must be different.");
      return;
    }
    const taken = new Set(takenIds);
    if (ids.some((id) => taken.has(id))) {
      setError("That unit id is already in the fleet.");
      return;
    }
    setError(null);
    onCreate({
      unitIds: ids,
      brand: brand.trim(),
      model: model.trim(),
      operational: normalizeOperational(operational, fallbackName),
    });
  };

  return (
    <AdminFormShell
      title="Add car"
      helper="Website-only cars. Booked on this site — not sent to Wizard. Brand, model, unit ids, year, and daily rate are required."
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Units" helper="How many identical cars to add." required>
            {({ id }) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={50}
                value={units}
                onChange={(e) =>
                  setUnitIds(resizeUnitIds(unitIds, Math.max(1, Math.min(50, Math.floor(Number(e.target.value)) || 1))))
                }
              />
            )}
          </Field>
          <Field label="Brand" required>
            {({ id }) => (
              <Input
                id={id}
                value={brand}
                placeholder="NISSAN"
                onChange={(e) => setBrand(e.target.value)}
              />
            )}
          </Field>
          <Field label="Model" required>
            {({ id }) => (
              <Input
                id={id}
                value={model}
                placeholder="MICRA"
                onChange={(e) => setModel(e.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {unitIds.map((value, index) => (
            <Field key={index} label={`Unit ${index + 1} id`} required>
              {({ id }) => (
                <Input
                  id={id}
                  value={value}
                  placeholder={`MICRA-${index + 1}`}
                  onChange={(e) =>
                    setUnitIds(unitIds.map((current, i) => (i === index ? e.target.value : current)))
                  }
                />
              )}
            </Field>
          ))}
        </div>
        {error ? <p className="body-sm text-danger">{error}</p> : null}
        <VehicleOperationalFields
          value={operational}
          showDisplayName={false}
          requireCoreSpecs
          onChange={(patch) => setOperational((prev) => ({ ...prev, ...patch }))}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="tertiary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canAdd}>
            Add {units} unit{units === 1 ? "" : "s"}
          </Button>
        </div>
      </form>
    </AdminFormShell>
  );
}
