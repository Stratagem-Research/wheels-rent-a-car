"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useCorporateTiers } from "@/lib/admin/useAdminStore";
import { writeCorporateTiers } from "@/lib/admin/store";
import type { CorporateTier } from "@/types/domain";
import type { CmsLocale } from "@/lib/i18n/localized";
import {
  getLocalizedString,
  getLocalizedStringArray,
  updateLocalizedString,
  updateLocalizedStringArray,
} from "@/lib/i18n/localized";

/**
 * /admin/corporate — corporate tier editor.
 *
 * Manages the three (or more) tiers displayed on /corporate. Each tier
 * is editable in-place: name, tagline, indicative price, fleet size,
 * inclusions, popular flag, CTA label. Persists via `writeCorporateTiers()` (Supabase).
 */
export default function AdminCorporatePage() {
  const confirmDialog = useConfirmDialog();
  const tiers = useCorporateTiers();
  const [working, setWorking] = React.useState<CorporateTier[]>(tiers);
  const [dirty, setDirty] = React.useState(false);
  const [activeLocale, setActiveLocale] = React.useState<CmsLocale>("en");

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
    const tier = working.find((t) => t.id === id);
    if (!tier) return;
    updateTier(id, {
      inclusions: updateLocalizedStringArray(tier.inclusions, activeLocale, [
        ...getLocalizedStringArray(tier.inclusions, activeLocale),
        "",
      ]),
    });
  };

  const updateInclusion = (tierId: string, idx: number, value: string) => {
    const tier = working.find((t) => t.id === tierId);
    if (!tier) return;
    const next = getLocalizedStringArray(tier.inclusions, activeLocale).map((inc, i) =>
      i === idx ? value : inc,
    );
    updateTier(tierId, {
      inclusions: updateLocalizedStringArray(tier.inclusions, activeLocale, next),
    });
  };

  const removeInclusion = (tierId: string, idx: number) => {
    const tier = working.find((t) => t.id === tierId);
    if (!tier) return;
    updateTier(tierId, {
      inclusions: updateLocalizedStringArray(
        tier.inclusions,
        activeLocale,
        getLocalizedStringArray(tier.inclusions, activeLocale).filter((_, i) => i !== idx),
      ),
    });
  };

  const addTier = () => {
    const id = `co-${Date.now().toString(36).slice(-6)}`;
    setWorking((w) => [
      ...w,
      {
        id,
        name: { en: "New tier", ar: "", fr: "" },
        tagline: { en: "Describe who this tier suits", ar: "", fr: "" },
        perDayCents: null,
        fleetSize: { en: "1-2 cars / month", ar: "", fr: "" },
        inclusions: { en: ["First inclusion"], ar: [], fr: [] },
      },
    ]);
    setDirty(true);
  };

  const removeTier = async (id: string) => {
    if (!(await confirmDialog({ title: "Remove this tier?", confirmLabel: "Remove" }))) return;
    setWorking((w) => w.filter((t) => t.id !== id));
    setDirty(true);
  };

  const onSave = async () => {
    const cleaned = working.map((t) => ({
      ...t,
      inclusions: {
        en: getLocalizedStringArray(t.inclusions, "en")
          .map((i) => i.trim())
          .filter(Boolean),
        ar: getLocalizedStringArray(t.inclusions, "ar")
          .map((i) => i.trim())
          .filter(Boolean),
        fr: getLocalizedStringArray(t.inclusions, "fr")
          .map((i) => i.trim())
          .filter(Boolean),
      },
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
        <div className="flex items-center gap-2">
          <label className="label-md text-ink-60">Locale</label>
          <select
            value={activeLocale}
            onChange={(event) => setActiveLocale(event.target.value as CmsLocale)}
            className="bg-paper border-border rounded-md border px-2 py-1 text-sm"
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
            <option value="fr">FR</option>
          </select>
          {dirty ? (
            <Button variant="secondary" onClick={onDiscard}>
              Discard
            </Button>
          ) : null}
          <Button variant="primary" onClick={onSave} disabled={!dirty}>
            {dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {working.map((tier) => (
          <AdminFormShell
            key={tier.id}
            title={getLocalizedString(tier.name, activeLocale) || "Untitled tier"}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                {({ id }) => (
                  <Input
                    id={id}
                    value={getLocalizedString(tier.name, activeLocale)}
                    onChange={(e) =>
                      updateTier(tier.id, {
                        name: updateLocalizedString(tier.name, activeLocale, e.target.value),
                      })
                    }
                  />
                )}
              </Field>
              <Field label="Fleet size" helper="e.g. '3-10 cars / month'">
                {({ id }) => (
                  <Input
                    id={id}
                    value={getLocalizedString(tier.fleetSize, activeLocale)}
                    onChange={(e) =>
                      updateTier(tier.id, {
                        fleetSize: updateLocalizedString(
                          tier.fleetSize,
                          activeLocale,
                          e.target.value,
                        ),
                      })
                    }
                  />
                )}
              </Field>
              <Field label="Tagline" className="sm:col-span-2">
                {({ id }) => (
                  <Input
                    id={id}
                    value={getLocalizedString(tier.tagline, activeLocale)}
                    onChange={(e) =>
                      updateTier(tier.id, {
                        tagline: updateLocalizedString(tier.tagline, activeLocale, e.target.value),
                      })
                    }
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
                    value={tier.ctaLabel ? getLocalizedString(tier.ctaLabel, activeLocale) : ""}
                    onChange={(e) =>
                      updateTier(tier.id, {
                        ctaLabel:
                          e.target.value.length > 0
                            ? updateLocalizedString(
                                tier.ctaLabel ?? { en: "", ar: "", fr: "" },
                                activeLocale,
                                e.target.value,
                              )
                            : undefined,
                      })
                    }
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
                {getLocalizedStringArray(tier.inclusions, activeLocale).map((inc, i) => (
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
              <Button type="button" variant="tertiary" onClick={() => void removeTier(tier.id)}>
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
