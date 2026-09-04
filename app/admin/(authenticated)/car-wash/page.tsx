"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { fetchAdminCarWashPackages, writeAdminCarWashPackages } from "@/lib/admin/catalog-store";
import type { CarWashPackage } from "@/types/domain";
import type { CmsLocale } from "@/lib/i18n/localized";
import { getLocalizedString, updateLocalizedString } from "@/lib/i18n/localized";

export default function AdminCarWashPage() {
  const confirmDialog = useConfirmDialog();
  const [packages, setPackages] = React.useState<CarWashPackage[]>([]);
  const [working, setWorking] = React.useState<CarWashPackage[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [activeLocale, setActiveLocale] = React.useState<CmsLocale>("en");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchAdminCarWashPackages();
        if (!cancelled) {
          setPackages(items);
          setWorking(items);
        }
      } catch (error) {
        if (!cancelled) alert(error instanceof Error ? error.message : "Failed to load packages.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePackage = (id: string, patch: Partial<CarWashPackage>) => {
    setWorking((w) => w.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDirty(true);
  };

  const addPackage = () => {
    const id = `cw-${Date.now().toString(36).slice(-6)}`;
    setWorking((w) => [
      ...w,
      {
        id,
        name: { en: "New package", ar: "", fr: "" },
        description: { en: "Describe this service", ar: "", fr: "" },
        durationMinutes: 60,
        currency: "USD",
        pricingMode: "fixed",
        priceCents: 0,
        icon: "sparkles",
        active: true,
      },
    ]);
    setDirty(true);
  };

  const removePackage = async (id: string) => {
    if (!(await confirmDialog({ title: "Remove this package?", confirmLabel: "Remove" }))) return;
    setWorking((w) => w.filter((p) => p.id !== id));
    setDirty(true);
  };

  const onSave = async () => {
    try {
      await writeAdminCarWashPackages(working);
      setPackages(working);
      setDirty(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save car wash packages.");
    }
  };

  const onDiscard = () => {
    setWorking(packages);
    setDirty(false);
  };

  return (
    <AdminPageShell
      eyebrow="Services"
      title="Car wash"
      description="Packages, pricing, and durations shown on /car-wash."
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
          <Button variant="primary" onClick={onSave} disabled={!dirty || loading}>
            {dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      }
    >
      {loading ? <p className="body-md text-ink-60">Loading packages…</p> : null}
      <div className="flex flex-col gap-6">
        {working.map((pkg) => (
          <AdminFormShell
            key={pkg.id}
            title={getLocalizedString(pkg.name, activeLocale) || "Untitled package"}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ID">
                {({ id }) => (
                  <Input
                    id={id}
                    value={pkg.id}
                    onChange={(e) => updatePackage(pkg.id, { id: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Lucide icon">
                {({ id }) => (
                  <Input
                    id={id}
                    value={pkg.icon}
                    onChange={(e) => updatePackage(pkg.id, { icon: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Name" className="sm:col-span-2">
                {({ id }) => (
                  <Input
                    id={id}
                    value={getLocalizedString(pkg.name, activeLocale)}
                    onChange={(e) =>
                      updatePackage(pkg.id, {
                        name: updateLocalizedString(pkg.name, activeLocale, e.target.value),
                      })
                    }
                  />
                )}
              </Field>
              <Field label="Description" className="sm:col-span-2">
                {({ id }) => (
                  <Input
                    id={id}
                    value={getLocalizedString(pkg.description, activeLocale)}
                    onChange={(e) =>
                      updatePackage(pkg.id, {
                        description: updateLocalizedString(
                          pkg.description,
                          activeLocale,
                          e.target.value,
                        ),
                      })
                    }
                  />
                )}
              </Field>
              <Field label="Duration (minutes)">
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    min={1}
                    value={pkg.durationMinutes}
                    onChange={(e) =>
                      updatePackage(pkg.id, { durationMinutes: Number(e.target.value) })
                    }
                  />
                )}
              </Field>
              <Field label="Turnaround hours" helper="Leave blank for same-day pickup.">
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    value={pkg.turnaroundHours ?? ""}
                    onChange={(e) =>
                      updatePackage(pkg.id, {
                        turnaroundHours: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                )}
              </Field>
              <Field label="Currency">
                {({ id }) => (
                  <Select
                    id={id}
                    value={pkg.currency}
                    onChange={(e) =>
                      updatePackage(pkg.id, {
                        currency: e.target.value as CarWashPackage["currency"],
                      })
                    }
                  >
                    <option value="USD">USD</option>
                    <option value="LBP">LBP</option>
                  </Select>
                )}
              </Field>
              <Field label="Pricing mode">
                {({ id }) => (
                  <Select
                    id={id}
                    value={pkg.pricingMode}
                    onChange={(e) =>
                      updatePackage(pkg.id, {
                        pricingMode: e.target.value as CarWashPackage["pricingMode"],
                      })
                    }
                  >
                    <option value="fixed">Fixed price</option>
                    <option value="by_vehicle_class">By vehicle class</option>
                  </Select>
                )}
              </Field>
              {pkg.pricingMode === "fixed" ? (
                <Field
                  label={pkg.currency === "USD" ? "Price (USD)" : "Price (LBP)"}
                  className="sm:col-span-2"
                >
                  {({ id }) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      value={
                        pkg.currency === "USD"
                          ? pkg.priceCents != null
                            ? String(pkg.priceCents / 100)
                            : ""
                          : pkg.priceLbp != null
                            ? String(pkg.priceLbp)
                            : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        if (pkg.currency === "USD") {
                          updatePackage(pkg.id, {
                            priceCents: v === "" ? undefined : Math.round(Number(v) * 100),
                          });
                        } else {
                          updatePackage(pkg.id, {
                            priceLbp: v === "" ? undefined : Number(v),
                          });
                        }
                      }}
                    />
                  )}
                </Field>
              ) : (
                <>
                  <Field label="Car price (LBP)">
                    {({ id }) => (
                      <Input
                        id={id}
                        type="number"
                        min={0}
                        value={pkg.vehiclePrices?.find((v) => v.vehicleClass === "car")?.amount ?? ""}
                        onChange={(e) => {
                          const amount = Number(e.target.value);
                          const suv =
                            pkg.vehiclePrices?.find((v) => v.vehicleClass === "suv")?.amount ?? 0;
                          updatePackage(pkg.id, {
                            vehiclePrices: [
                              { vehicleClass: "car", amount },
                              { vehicleClass: "suv", amount: suv },
                            ],
                          });
                        }}
                      />
                    )}
                  </Field>
                  <Field label="SUV price (LBP)">
                    {({ id }) => (
                      <Input
                        id={id}
                        type="number"
                        min={0}
                        value={pkg.vehiclePrices?.find((v) => v.vehicleClass === "suv")?.amount ?? ""}
                        onChange={(e) => {
                          const amount = Number(e.target.value);
                          const car =
                            pkg.vehiclePrices?.find((v) => v.vehicleClass === "car")?.amount ?? 0;
                          updatePackage(pkg.id, {
                            vehiclePrices: [
                              { vehicleClass: "car", amount: car },
                              { vehicleClass: "suv", amount },
                            ],
                          });
                        }}
                      />
                    )}
                  </Field>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              <Checkbox
                checked={Boolean(pkg.popular)}
                onCheckedChange={(c) => updatePackage(pkg.id, { popular: c === true })}
                label="Mark as Popular"
              />
              <Checkbox
                checked={pkg.active !== false}
                onCheckedChange={(c) => updatePackage(pkg.id, { active: c === true })}
                label="Active on site"
              />
              <Checkbox
                checked={Boolean(pkg.quoteOnly)}
                onCheckedChange={(c) => updatePackage(pkg.id, { quoteOnly: c === true })}
                label="Quote on request only"
              />
            </div>
            <div className="border-border flex justify-end border-t pt-4">
              <Button type="button" variant="tertiary" onClick={() => void removePackage(pkg.id)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Remove package
              </Button>
            </div>
          </AdminFormShell>
        ))}
        <Button variant="secondary" onClick={addPackage}>
          <Plus className="size-4" aria-hidden="true" />
          Add package
        </Button>
      </div>
    </AdminPageShell>
  );
}
