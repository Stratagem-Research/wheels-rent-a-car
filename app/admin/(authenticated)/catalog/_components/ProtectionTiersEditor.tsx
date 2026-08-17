"use client";

import { Plus, Trash2 } from "lucide-react";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { AdminReplaceListEditor } from "@/components/admin/AdminReplaceListEditor";
import { InclusionsListEditor } from "@/components/admin/InclusionsListEditor";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import type { AdminReplaceListControls } from "@/hooks/useAdminReplaceList";
import type { ProtectionTier } from "@/types/domain";

export function ProtectionTiersEditor({
  editor,
}: {
  editor: AdminReplaceListControls<ProtectionTier>;
}) {
  return (
    <AdminReplaceListEditor editor={editor} loadingMessage="Loading protection tiers…">
      {({ items, update, remove, append }) => (
        <>
          {items.map((item, index) => (
            <AdminFormShell
              key={item.id}
              title={item.name || "Untitled tier"}
              footer={
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => remove(index, "Remove this tier?")}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove tier
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
                <Field label="Name">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={item.name}
                      onChange={(e) => update(index, { name: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Per day surcharge (USD)">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      step={0.01}
                      value={(item.perDayCents / 100).toFixed(2)}
                      onChange={(e) =>
                        update(index, { perDayCents: Math.round(Number(e.target.value) * 100) })
                      }
                    />
                  )}
                </Field>
                <Field label="Deductible (USD)">
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      step={1}
                      value={(item.deductibleCents / 100).toFixed(0)}
                      onChange={(e) =>
                        update(index, {
                          deductibleCents: Math.round(Number(e.target.value) * 100),
                        })
                      }
                    />
                  )}
                </Field>
                <Checkbox
                  checked={item.popular}
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
                id: `pt-new-${items.length + 1}`,
                name: "New tier",
                perDayCents: 0,
                deductibleCents: 50_000,
                inclusions: ["First inclusion"],
                popular: false,
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
