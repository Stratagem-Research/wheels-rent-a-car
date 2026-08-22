"use client";

import { Plus, Trash2 } from "lucide-react";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { AdminReplaceListEditor } from "@/components/admin/AdminReplaceListEditor";
import { InclusionsListEditor } from "@/components/admin/InclusionsListEditor";
import { PriceCentsInput } from "@/components/admin/PriceCentsInput";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AdminReplaceListControls } from "@/hooks/useAdminReplaceList";
import type { LongTermTier } from "@/types/domain";

const DURATIONS: LongTermTier["durationMonths"][] = [1, 3, 6, 12];

export function LongTermTiersEditor({
  editor,
}: {
  editor: AdminReplaceListControls<LongTermTier>;
}) {
  const { saving, dirty, save } = editor;
  return (
    <AdminReplaceListEditor editor={editor} loadingMessage="Loading long-term tiers…">
      {({ items, update, remove, append }) => (
        <>
          {items.map((item, index) => (
            <AdminFormShell
              key={item.id}
              title={`${item.durationMonths} month${item.durationMonths === 1 ? "" : "s"}`}
              footer={
                <>
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={() => remove(index, "Remove this tier?")}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove tier
                  </Button>
                  <Button type="button" onClick={() => void save()} loading={saving} disabled={!dirty}>
                    {dirty ? "Save long-term tiers" : "Saved"}
                  </Button>
                </>
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
                <Field label="Duration (months)">
                  {({ id }) => (
                    <Select
                      id={id}
                      value={String(item.durationMonths)}
                      onChange={(e) =>
                        update(index, {
                          durationMonths: Number(e.target.value) as LongTermTier["durationMonths"],
                        })
                      }
                    >
                      {DURATIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="From price (USD/day)">
                  {({ id }) => (
                    <PriceCentsInput
                      id={id}
                      cents={item.perDayCents}
                      onChange={(perDayCents) => update(index, { perDayCents })}
                    />
                  )}
                </Field>
                <Field label="Savings %">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      max={100}
                      value={item.savingsPercent}
                      onChange={(e) => update(index, { savingsPercent: Number(e.target.value) })}
                    />
                  )}
                </Field>
                <Checkbox
                  checked={Boolean(item.popular)}
                  onCheckedChange={(c) => update(index, { popular: c === true })}
                  label="Mark as Popular"
                />
              </div>
              <InclusionsListEditor
                inclusions={item.inclusions}
                onChange={(inclusions) => update(index, { inclusions })}
              />
            </AdminFormShell>
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              append({
                id: `lt-new-${items.length + 1}`,
                durationMonths: 3,
                perDayCents: 1950,
                savingsPercent: 10,
                inclusions: ["Comprehensive insurance"],
              })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add tier
          </Button>
        </>
      )}
    </AdminReplaceListEditor>
  );
}
