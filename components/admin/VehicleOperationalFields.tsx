"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CATEGORY_LABELS } from "@/lib/vehicles/labels";
import type { VehicleOperational } from "@/lib/vehicles/vehicle-operational";

const TRANSMISSIONS = ["automatic", "manual"] as const;
const FUELS = ["petrol", "diesel", "hybrid", "electric"] as const;
const STATUSES = ["available", "active", "unavailable", "sold"] as const;
const WEBSITE_CATEGORIES = Object.keys(CATEGORY_LABELS).filter((key) => key !== "all");

export function VehicleOperationalFields({
  value,
  onChange,
  showDisplayName = true,
  requireCoreSpecs = false,
}: {
  value: VehicleOperational;
  onChange: (patch: Partial<VehicleOperational>) => void;
  showDisplayName?: boolean;
  requireCoreSpecs?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className={showDisplayName ? "grid gap-4 sm:grid-cols-2" : undefined}>
        {showDisplayName ? (
          <Field label="Display name" helper="Wizard display_name / name.">
            {({ id }) => (
              <Input
                id={id}
                value={value.display_name ?? ""}
                placeholder="MICRA 655560"
                onChange={(e) => onChange({ display_name: e.target.value, name: e.target.value })}
              />
            )}
          </Field>
        ) : null}
        <Field label="Color">
          {({ id }) => (
            <Input
              id={id}
              value={value.color ?? ""}
              placeholder="GRAY"
              onChange={(e) => onChange({ color: e.target.value })}
            />
          )}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Year" required={requireCoreSpecs}>
          {({ id }) => (
            <Input
              id={id}
              type="number"
              value={value.year ?? ""}
              onChange={(e) => onChange({ year: Number(e.target.value) || null })}
            />
          )}
        </Field>
        <Field label="Seats">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              value={value.number_of_seats ?? ""}
              onChange={(e) => onChange({ number_of_seats: Number(e.target.value) || null })}
            />
          )}
        </Field>
        <Field label="Doors">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              value={value.number_of_doors ?? ""}
              onChange={(e) => onChange({ number_of_doors: Number(e.target.value) || null })}
            />
          )}
        </Field>
        <Field label="Vehicle type id">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              value={value.vehicle_type_id ?? ""}
              onChange={(e) => onChange({ vehicle_type_id: Number(e.target.value) || null })}
            />
          )}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          {({ id }) => (
            <Select
              id={id}
              value={value.category_name ?? "small"}
              onChange={(e) =>
                onChange({ category_name: e.target.value, vehicle_type_name: e.target.value })
              }
            >
              <option value="small">small</option>
              {WEBSITE_CATEGORIES.map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Transmission">
          {({ id }) => (
            <Select
              id={id}
              value={value.transmission ?? "automatic"}
              onChange={(e) => onChange({ transmission: e.target.value, gearbox: e.target.value })}
            >
              {TRANSMISSIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Fuel">
          {({ id }) => (
            <Select
              id={id}
              value={value.fuel_type ?? "petrol"}
              onChange={(e) => onChange({ fuel_type: e.target.value })}
            >
              {FUELS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Status">
          {({ id }) => (
            <Select
              id={id}
              value={value.status ?? "available"}
              onChange={(e) => onChange({ status: e.target.value, wizard_status: e.target.value })}
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Daily rate" required={requireCoreSpecs}>
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={0}
              step="0.01"
              value={value.daily_rate ?? ""}
              onChange={(e) => onChange({ daily_rate: Number(e.target.value) || null })}
            />
          )}
        </Field>
        <Field label="Currency">
          {({ id }) => (
            <Input
              id={id}
              value={value.currency ?? "USD"}
              onChange={(e) => onChange({ currency: e.target.value })}
            />
          )}
        </Field>
        <Field label="Location">
          {({ id }) => (
            <Input
              id={id}
              value={value.location_name ?? ""}
              placeholder="Main Branch"
              onChange={(e) =>
                onChange({
                  location_name: e.target.value,
                  branch_name: e.target.value,
                  area_name: e.target.value,
                })
              }
            />
          )}
        </Field>
      </div>
      <div className="flex flex-wrap gap-4">
        <Checkbox
          label="Website enabled"
          checked={value.website_enabled !== false}
          onCheckedChange={(checked) => onChange({ website_enabled: checked === true })}
        />
        <Checkbox
          label="Publicly bookable"
          checked={value.is_publicly_bookable !== false}
          onCheckedChange={(checked) => onChange({ is_publicly_bookable: checked === true })}
        />
        <Checkbox
          label="Marketplace enabled"
          checked={value.marketplace_enabled !== false}
          onCheckedChange={(checked) => onChange({ marketplace_enabled: checked === true })}
        />
        <Checkbox
          label="Sold"
          checked={value.is_sold === true}
          onCheckedChange={(checked) => onChange({ is_sold: checked === true })}
        />
      </div>
    </div>
  );
}
