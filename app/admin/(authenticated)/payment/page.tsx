"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { toast } from "@/components/ui/Toast";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";
import {
  DEFAULT_PAYMENT_SETTINGS,
  SURCHARGEABLE_PAYMENT_METHODS,
} from "@/lib/payments/payment-settings";
import type {
  PaymentSettings,
  PaymentSurcharge,
  PaymentSurchargeDayTier,
  PaymentSurchargeMode,
  SurchargeablePaymentMethod,
} from "@/types/domain";

/**
 * /admin/payment — the bank account printed on the checkout "Bank transfer"
 * panel, and the surcharge each non-cash method adds to the total at the
 * last booking step. Cash never carries a surcharge.
 *
 * GET/PUT /api/admin/payment.
 */
const METHOD_LABELS: Record<SurchargeablePaymentMethod, string> = {
  transfer: "Bank transfer",
  omt: "OMT / Whish / Bob Finance",
  "whish-online": "Whish online checkout",
  neo: "Bank Audi NEO",
};

const MODE_LABELS: Record<PaymentSurchargeMode, string> = {
  none: "No charge",
  fixed: "Fixed amount",
  "per-day": "Per day",
  percent: "Percentage of total",
  "day-tiers": "By rental length",
};

/** Next band starts the day after the last one ends, so the ladder has no gap. */
function nextDayTier(tiers: PaymentSurchargeDayTier[]): PaymentSurchargeDayTier {
  const last = tiers[tiers.length - 1];
  const startDay = last ? (last.endDay == null ? last.startDay + 1 : last.endDay + 1) : 1;
  return { startDay, endDay: null, perDayCents: 0 };
}

export default function AdminPaymentPage() {
  const [settings, setSettings] = React.useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to load payment settings.");
      }
      const data = (await res.json()) as { settings: PaymentSettings };
      setSettings(data.settings);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load payment settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to save payment settings.");
      }
      await refresh();
      toast.success("Saved payment settings.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save payment settings.");
    } finally {
      setSaving(false);
    }
  };

  const setBank = (patch: Partial<PaymentSettings["bankTransfer"]>) =>
    setSettings((s) => ({ ...s, bankTransfer: { ...s.bankTransfer, ...patch } }));

  const setSurcharge = (method: SurchargeablePaymentMethod, patch: Partial<PaymentSurcharge>) =>
    setSettings((s) => ({
      ...s,
      surcharges: { ...s.surcharges, [method]: { ...s.surcharges[method], ...patch } },
    }));

  const setDayTiers = (
    method: SurchargeablePaymentMethod,
    mutate: (tiers: PaymentSurchargeDayTier[]) => PaymentSurchargeDayTier[],
  ) =>
    setSettings((s) => {
      const current = s.surcharges[method];
      return {
        ...s,
        surcharges: {
          ...s.surcharges,
          [method]: { ...current, dayTiers: mutate(current.dayTiers ?? []) },
        },
      };
    });

  const setDayTier = (
    method: SurchargeablePaymentMethod,
    index: number,
    patch: Partial<PaymentSurchargeDayTier>,
  ) =>
    setDayTiers(method, (tiers) =>
      tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    );

  return (
    <AdminPageShell
      eyebrow="Settings"
      title="Payment"
      description="Bank transfer details and the fee each non-cash method adds to the total"
      backHref="/admin"
      backLabel="Back to dashboard"
      actions={
        <Button onClick={() => void save()} loading={saving} disabled={loading}>
          Save payment settings
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <AdminFormShell title="Bank transfer details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank name">
              {({ id }) => (
                <Input
                  id={id}
                  placeholder="Bank of Beirut SAL"
                  value={settings.bankTransfer.bankName}
                  onChange={(e) => setBank({ bankName: e.target.value })}
                />
              )}
            </Field>
            <Field label="Account name">
              {({ id }) => (
                <Input
                  id={id}
                  placeholder="Wheels Rent A Car SARL"
                  value={settings.bankTransfer.accountName}
                  onChange={(e) => setBank({ accountName: e.target.value })}
                />
              )}
            </Field>
            <Field label="Account number">
              {({ id }) => (
                <Input
                  id={id}
                  value={settings.bankTransfer.accountNumber}
                  onChange={(e) => setBank({ accountNumber: e.target.value })}
                />
              )}
            </Field>
            <Field label="IBAN">
              {({ id }) => (
                <Input
                  id={id}
                  placeholder="LB00 0000 0000 0000 0000 0000 0000"
                  value={settings.bankTransfer.iban}
                  onChange={(e) => setBank({ iban: e.target.value })}
                />
              )}
            </Field>
            <Field label="SWIFT / BIC">
              {({ id }) => (
                <Input
                  id={id}
                  value={settings.bankTransfer.swift}
                  onChange={(e) => setBank({ swift: e.target.value })}
                />
              )}
            </Field>
          </div>
          <Field label="Transfer instructions">
            {({ id }) => (
              <Textarea
                id={id}
                rows={2}
                placeholder="Use your booking reference as the transfer description."
                value={settings.bankTransfer.instructions}
                onChange={(e) => setBank({ instructions: e.target.value })}
              />
            )}
          </Field>
        </AdminFormShell>

        <AdminFormShell
          title="Payment method charges"
          helper="Added to the customer's total at the last booking step. Percentages apply to the total before the fee. Cash is always free."
        >
          <div className="flex flex-col gap-4">
            {SURCHARGEABLE_PAYMENT_METHODS.map((method) => {
              const surcharge = settings.surcharges[method];
              return (
                <div
                  key={method}
                  className="border-border grid items-end gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto]"
                >
                  <p className="headline-xs text-ink-100">{METHOD_LABELS[method]}</p>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-48">
                      <Field label="Charge type">
                        {({ id }) => (
                          <Select
                            id={id}
                            value={surcharge.mode}
                            onChange={(e) =>
                              setSurcharge(method, {
                                mode: e.target.value as PaymentSurchargeMode,
                              })
                            }
                          >
                            {(Object.keys(MODE_LABELS) as PaymentSurchargeMode[]).map((mode) => (
                              <option key={mode} value={mode}>
                                {MODE_LABELS[mode]}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    </div>
                    {surcharge.mode === "fixed" || surcharge.mode === "per-day" ? (
                      <div className="w-40">
                        <Field label={surcharge.mode === "per-day" ? "USD per day" : "USD"}>
                          {({ id }) => (
                            <Input
                              id={id}
                              type="number"
                              min={0}
                              step="0.01"
                              value={(surcharge.amountCents / 100).toString()}
                              onChange={(e) =>
                                setSurcharge(method, {
                                  amountCents: Math.max(
                                    0,
                                    Math.round(Number(e.target.value || 0) * 100),
                                  ),
                                })
                              }
                            />
                          )}
                        </Field>
                      </div>
                    ) : null}
                    {surcharge.mode === "percent" ? (
                      <div className="w-40">
                        <Field label="Percent of total">
                          {({ id }) => (
                            <Input
                              id={id}
                              type="number"
                              min={0}
                              max={100}
                              step="0.1"
                              value={surcharge.percent.toString()}
                              onChange={(e) =>
                                setSurcharge(method, {
                                  percent: Math.min(100, Math.max(0, Number(e.target.value || 0))),
                                })
                              }
                            />
                          )}
                        </Field>
                      </div>
                    ) : null}
                  </div>
                  {surcharge.mode === "day-tiers" ? (
                    <div className="flex flex-col gap-3 sm:col-span-2">
                      <p className="body-sm text-ink-60">
                        Each day of the rental is charged at the rate of the band it falls in. A day
                        outside every band is charged nothing. Leave &ldquo;End day&rdquo; blank for
                        an open-ended band.
                      </p>
                      {(surcharge.dayTiers ?? []).length === 0 ? (
                        <p className="body-sm text-ink-60">No day bands yet.</p>
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {(surcharge.dayTiers ?? []).map((tier, index) => (
                            <li key={index} className="flex flex-wrap items-end gap-3">
                              <div className="w-28">
                                <Field label="Start day">
                                  {({ id }) => (
                                    <Input
                                      id={id}
                                      type="number"
                                      min={1}
                                      step="1"
                                      value={tier.startDay.toString()}
                                      onChange={(e) =>
                                        setDayTier(method, index, {
                                          startDay: Math.max(
                                            1,
                                            Math.round(Number(e.target.value || 1)),
                                          ),
                                        })
                                      }
                                    />
                                  )}
                                </Field>
                              </div>
                              <div className="w-28">
                                <Field label="End day">
                                  {({ id }) => (
                                    <Input
                                      id={id}
                                      type="number"
                                      min={tier.startDay}
                                      step="1"
                                      placeholder="Any"
                                      value={tier.endDay == null ? "" : tier.endDay.toString()}
                                      onChange={(e) =>
                                        setDayTier(method, index, {
                                          endDay:
                                            e.target.value.trim() === ""
                                              ? null
                                              : Math.max(
                                                  tier.startDay,
                                                  Math.round(Number(e.target.value)),
                                                ),
                                        })
                                      }
                                    />
                                  )}
                                </Field>
                              </div>
                              <div className="w-40">
                                <Field label="USD per day">
                                  {({ id }) => (
                                    <Input
                                      id={id}
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={(tier.perDayCents / 100).toString()}
                                      onChange={(e) =>
                                        setDayTier(method, index, {
                                          perDayCents: Math.max(
                                            0,
                                            Math.round(Number(e.target.value || 0) * 100),
                                          ),
                                        })
                                      }
                                    />
                                  )}
                                </Field>
                              </div>
                              <Button
                                type="button"
                                variant="tertiary"
                                onClick={() =>
                                  setDayTiers(method, (tiers) =>
                                    tiers.filter((_, i) => i !== index),
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setDayTiers(method, (tiers) => [...tiers, nextDayTier(tiers)])
                          }
                        >
                          Add day band
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </AdminFormShell>
      </div>
    </AdminPageShell>
  );
}
