"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { useCorporateTiers } from "@/lib/admin/useAdminStore";
import { writeCorporateTiers } from "@/lib/admin/store";
import type { CorporateTier } from "@/types/domain";

/**
 * /admin/corporate — corporate tier editor.
 *
 * Manages the three (or more) tiers displayed on /corporate. Each tier
 * is editable in-place: name, tagline, indicative price, fleet size,
 * inclusions, popular flag, CTA label. Persists via `writeCorporateTiers()` (Supabase).
 */
export default function AdminCorporatePage() {
  const tiers = useCorporateTiers();
  const [working, setWorking] = React.useState<CorporateTier[]>(tiers);
  const [dirty, setDirty] = React.useState(false);

  // Reset working copy whenever the persisted store changes from elsewhere.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setWorking(tiers);
    setDirty(false);
  }, [tiers]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateTier = (id: string, patch: Partial<CorporateTier>) => {
    setWorking((w) => w.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setDirty(true);
  };

  const addInclusion = (id: string) => {
    updateTier(id, {
      inclusions: [...(working.find((t) => t.id === id)?.inclusions ?? []), ""],
    });
  };

  const updateInclusion = (tierId: string, idx: number, value: string) => {
    const tier = working.find((t) => t.id === tierId);
    if (!tier) return;
    const next = tier.inclusions.map((inc, i) => (i === idx ? value : inc));
    updateTier(tierId, { inclusions: next });
  };

  const removeInclusion = (tierId: string, idx: number) => {
    const tier = working.find((t) => t.id === tierId);
    if (!tier) return;
    updateTier(tierId, { inclusions: tier.inclusions.filter((_, i) => i !== idx) });
  };

  const addTier = () => {
    const id = `co-${Date.now().toString(36).slice(-6)}`;
    setWorking((w) => [
      ...w,
      {
        id,
        name: "New tier",
        tagline: "Describe who this tier suits",
        perDayCents: null,
        fleetSize: "1-2 cars / month",
        inclusions: ["First inclusion"],
      },
    ]);
    setDirty(true);
  };

  const removeTier = (id: string) => {
    if (!confirm("Remove this tier?")) return;
    setWorking((w) => w.filter((t) => t.id !== id));
    setDirty(true);
  };

  const onSave = async () => {
    const cleaned = working.map((t) => ({
      ...t,
      inclusions: t.inclusions.map((i) => i.trim()).filter(Boolean),
    }));
    try {
      await writeCorporateTiers(cleaned);
      setDirty(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save corporate tiers.");
    }
  };

  const onDiscard = () => {
    setWorking(tiers);
    setDirty(false);
  };

  return (
    <AdminPageShell
      eyebrow="B2B"
      title="Corporate"
      description="Tier comparison, taglines, and inclusions shown on the /corporate page."
      actions={
        <>
          {dirty ? (
            <Button variant="secondary" onClick={onDiscard}>
              Discard
            </Button>
          ) : null}
          <Button variant="primary" onClick={onSave} disabled={!dirty}>
            {dirty ? "Save changes" : "Saved"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {working.map((tier) => (
          <AdminFormShell key={tier.id} title={tier.name || "Untitled tier"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                {({ id }) => (
                  <Input
                    id={id}
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Fleet size" helper="e.g. '3-10 cars / month'">
                {({ id }) => (
                  <Input
                    id={id}
                    value={tier.fleetSize}
                    onChange={(e) => updateTier(tier.id, { fleetSize: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Tagline" className="sm:col-span-2">
                {({ id }) => (
                  <Input
                    id={id}
                    value={tier.tagline}
                    onChange={(e) => updateTier(tier.id, { tagline: e.target.value })}
                  />
                )}
              </Field>
              <Field
                label="Indicative price (USD/day)"
                helper="Leave blank for 'Custom' / quote-only tier."
              >
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    value={tier.perDayCents !== null ? String(tier.perDayCents / 100) : ""}
                    placeholder="Leave blank for Custom"
                    onChange={(e) => {
                      const v = e.target.value;
                      updateTier(tier.id, {
                        perDayCents: v === "" ? null : Math.round(Number(v) * 100),
                      });
                    }}
                  />
                )}
              </Field>
              <Field label="CTA label" helper="Defaults to 'Get a quote'.">
                {({ id }) => (
                  <Input
                    id={id}
                    value={tier.ctaLabel ?? ""}
                    onChange={(e) => updateTier(tier.id, { ctaLabel: e.target.value || undefined })}
                  />
                )}
              </Field>
            </div>

            <Checkbox
              checked={Boolean(tier.popular)}
              onCheckedChange={(c) => updateTier(tier.id, { popular: c === true })}
              label="Mark this tier as Popular"
            />

            <div>
              <p className="label-md text-ink-70 mb-2 block">Inclusions</p>
              <div className="flex flex-col gap-2">
                {tier.inclusions.map((inc, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        value={inc}
                        onChange={(e) => updateInclusion(tier.id, i, e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="tertiary"
                      size="md"
                      onClick={() => removeInclusion(tier.id, i)}
                      aria-label="Remove inclusion"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => addInclusion(tier.id)}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add inclusion
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-border flex justify-end border-t pt-4">
              <Button type="button" variant="tertiary" onClick={() => removeTier(tier.id)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Remove this tier
              </Button>
            </div>
          </AdminFormShell>
        ))}

        <div>
          <Button variant="secondary" onClick={addTier}>
            <Plus className="size-4" aria-hidden="true" />
            Add tier
          </Button>
        </div>
      </div>
    </AdminPageShell>
  );
}
