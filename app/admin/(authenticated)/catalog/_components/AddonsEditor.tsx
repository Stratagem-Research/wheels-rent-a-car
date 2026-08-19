"use client";

import { Plus, Trash2 } from "lucide-react";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { AdminReplaceListEditor } from "@/components/admin/AdminReplaceListEditor";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AdminReplaceListControls } from "@/hooks/useAdminReplaceList";
import type { AddOn, AddOnCategory } from "@/types/domain";

const CATEGORIES: AddOnCategory[] = [
  "driver-access",
  "comfort",
  "connectivity",
  "convenience",
  "sustainability",
];

export function AddonsEditor({ editor }: { editor: AdminReplaceListControls<AddOn> }) {
  return (
    <AdminReplaceListEditor editor={editor} loadingMessage="Loading add-ons…">
      {({ items, update, remove, append }) => (
        <>
          {items.map((item, index) => (
            <AdminFormShell
              key={item.id}
              title={item.name || "Untitled add-on"}
              footer={
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => remove(index, "Remove this add-on?")}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              }
            >
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
                <Field label="Lucide icon name">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={item.icon}
                      onChange={(e) => update(index, { icon: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Name" className="sm:col-span-2">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={item.name}
                      onChange={(e) => update(index, { name: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={item.description}
                      onChange={(e) => update(index, { description: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Category">
                  {({ id }) => (
                    <Select
                      id={id}
                      value={item.category}
                      onChange={(e) => update(index, { category: e.target.value as AddOnCategory })}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Pricing">
                  {({ id }) => (
                    <Select
                      id={id}
                      value={item.pricing}
                      onChange={(e) =>
                        update(index, { pricing: e.target.value as AddOn["pricing"] })
                      }
                    >
                      <option value="per-day">Per day</option>
                      <option value="per-rental">Per rental</option>
                    </Select>
                  )}
                </Field>
                <Field
                  label="Quantity unit"
                  helper="GB lets the customer type a data allowance. Price below is per GB for the rental."
                >
                  {({ id }) => (
                    <Select
                      id={id}
                      value={item.quantityUnit ?? "item"}
                      onChange={(e) => {
                        const gb = e.target.value === "gb";
                        update(index, {
                          quantityUnit: gb ? "gb" : undefined,
                          multiQuantity: gb ? true : item.multiQuantity,
                          pricing: gb ? "per-rental" : item.pricing,
                          maxQuantity: gb ? (item.maxQuantity ?? 200) : item.maxQuantity,
                        });
                      }}
                    >
                      <option value="item">Item</option>
                      <option value="gb">GB (data allowance)</option>
                    </Select>
                  )}
                </Field>
                <Field label={item.quantityUnit === "gb" ? "Price per GB (USD)" : "Price (USD)"}>
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      step={0.01}
                      value={(item.priceCents / 100).toFixed(2)}
                      onChange={(e) =>
                        update(index, { priceCents: Math.round(Number(e.target.value) * 100) })
                      }
                    />
                  )}
                </Field>
                <Field label="Max quantity" helper="Leave blank if not multi-qty.">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      min={1}
                      value={item.maxQuantity ?? ""}
                      onChange={(e) =>
                        update(index, {
                          maxQuantity: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  )}
                </Field>
                <Checkbox
                  checked={item.multiQuantity}
                  onCheckedChange={(c) => update(index, { multiQuantity: c === true })}
                  label="Allow multiple quantity"
                />
              </div>
            </AdminFormShell>
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              append({
                id: `ao-new-${items.length + 1}`,
                name: "New add-on",
                description: "",
                category: "comfort",
                pricing: "per-day",
                priceCents: 500,
                multiQuantity: false,
                icon: "circle",
              })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add add-on
          </Button>
        </>
      )}
    </AdminReplaceListEditor>
  );
}
