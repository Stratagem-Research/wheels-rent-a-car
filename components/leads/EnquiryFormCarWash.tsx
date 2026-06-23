"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { PhoneInput, type PhoneValue } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LeadFormSuccess } from "./SuccessState";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { formatCarWashPackagePrice, resolveCarWashPrice } from "@/lib/car-wash/display-price";
import { getLocalizedString } from "@/lib/i18n/localized";
import type { CarWashPackage } from "@/types/domain";

const VEHICLE_CLASSES = ["car", "suv"] as const;
type VehicleClass = (typeof VEHICLE_CLASSES)[number];

interface FormState {
  fullName: string;
  email: string;
  phone: PhoneValue;
  packageId: string;
  vehicleClass: VehicleClass;
  preferredDate: string;
  preferredTime: string;
  vehicleMakeModel: string;
  notes: string;
  marketing: boolean;
}

export interface EnquiryFormCarWashProps {
  packages: CarWashPackage[];
  initialPackageId?: string;
  formId?: string;
}

export function EnquiryFormCarWash({
  packages,
  initialPackageId = "normal-wash",
  formId = "enquiry",
}: EnquiryFormCarWashProps) {
  const t = useTranslations("leads");
  const tWash = useTranslations("carWash");
  const locale = useLocale();
  const [form, setForm] = React.useState<FormState>({
    fullName: "",
    email: "",
    phone: { countryIso: "LB", national: "" },
    packageId: initialPackageId,
    vehicleClass: "car",
    preferredDate: "",
    preferredTime: "",
    vehicleMakeModel: "",
    notes: "",
    marketing: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const selectedPackage = packages.find((p) => p.id === form.packageId);
  const needsVehicleClass = selectedPackage?.pricingMode === "by_vehicle_class";
  const showTurnaroundWarning =
    selectedPackage?.turnaroundHours != null && selectedPackage.turnaroundHours > 0;
  const estimatedPrice =
    selectedPackage &&
    formatCarWashPackagePrice(selectedPackage, {
      car: tWash("vehicleCar"),
      suv: tWash("vehicleSuv"),
      quoteOnRequest: t("carWash.quoteOnRequest"),
    }, needsVehicleClass ? form.vehicleClass : undefined);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setForm((f) => ({ ...f, packageId: initialPackageId }));
  }, [initialPackageId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = t("fullNameRequired");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = t("emailInvalid");
    if (!form.phone.national.trim()) e.phone = t("mobileRequired");
    if (!form.preferredDate) e.preferredDate = t("carWash.preferredDateRequired");
    if (!form.packageId) e.packageId = t("carWash.packageRequired");
    if (needsVehicleClass && !form.vehicleClass) e.vehicleClass = t("carWash.vehicleClassRequired");
    return e;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      document
        .querySelector<HTMLElement>(`#${formId} [aria-invalid="true"]`)
        ?.focus?.({ preventScroll: false });
      return;
    }
    setSubmitting(true);
    try {
      const priceSnapshot = selectedPackage
        ? resolveCarWashPrice(
            selectedPackage,
            needsVehicleClass ? form.vehicleClass : undefined,
          )
        : null;
      await api.post(endpoints.leadsCarWash, {
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: `+${dialFor(form.phone.countryIso)}${form.phone.national.replace(/\D/g, "")}`,
        packageId: form.packageId,
        vehicleClass: needsVehicleClass ? form.vehicleClass : undefined,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime.trim() || undefined,
        vehicleMakeModel: form.vehicleMakeModel.trim() || undefined,
        notes: form.notes.trim() || undefined,
        marketing: form.marketing,
        metadata: {
          packageName: selectedPackage
            ? getLocalizedString(selectedPackage.name, locale)
            : form.packageId,
          estimatedPrice: priceSnapshot?.label ?? estimatedPrice,
          currency: priceSnapshot?.currency,
        },
      });
      setSubmitted(true);
    } catch {
      setErrors({ form: t("submitError") });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <LeadFormSuccess />;

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {showTurnaroundWarning ? (
        <p className="body-sm text-warning rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          {tWash("deepCleanWarning", { hours: selectedPackage?.turnaroundHours ?? 36 })}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("fullName")} required error={errors.fullName}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          )}
        </Field>
        <Field label={t("email")} required error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          )}
        </Field>
        <Field label={t("mobile")} required error={errors.phone}>
          {({ id, describedBy, invalid }) => (
            <PhoneInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.phone}
              onValueChange={(phone) => setForm((f) => ({ ...f, phone }))}
            />
          )}
        </Field>
        <Field label={t("carWash.package")} required error={errors.packageId}>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={form.packageId}
              onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {getLocalizedString(pkg.name, locale)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {needsVehicleClass ? (
          <Field label={t("carWash.vehicleClass")} required error={errors.vehicleClass}>
            {({ id }) => (
              <Select
                id={id}
                value={form.vehicleClass}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vehicleClass: e.target.value as VehicleClass }))
                }
              >
                {VEHICLE_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {tWash(c === "car" ? "vehicleCar" : "vehicleSuv")}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : null}
        <Field label={t("carWash.preferredDate")} required error={errors.preferredDate}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="date"
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.preferredDate}
              onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
            />
          )}
        </Field>
        <Field label={t("carWash.preferredTime")}>
          {({ id }) => (
            <Input
              id={id}
              placeholder={t("carWash.preferredTimePlaceholder")}
              value={form.preferredTime}
              onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
            />
          )}
        </Field>
        <Field label={t("carWash.vehicleMakeModel")} className="sm:col-span-2">
          {({ id }) => (
            <Input
              id={id}
              placeholder={t("carWash.vehicleMakeModelPlaceholder")}
              value={form.vehicleMakeModel}
              onChange={(e) => setForm((f) => ({ ...f, vehicleMakeModel: e.target.value }))}
            />
          )}
        </Field>
      </div>
      {estimatedPrice ? (
        <p className="label-md text-ink-60">
          {t("carWash.estimatedPrice")}: <span className="text-ink-95">{estimatedPrice}</span>
        </p>
      ) : null}
      <Field label={t("notes")}>
        {({ id }) => (
          <Textarea
            id={id}
            rows={4}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        )}
      </Field>
      <Checkbox
        checked={form.marketing}
        onCheckedChange={(c) => setForm((f) => ({ ...f, marketing: c === true }))}
        label={t("marketing")}
      />
      {errors.form ? <ErrorText>{errors.form}</ErrorText> : null}
      <Button type="submit" variant="cta" size="lg" loading={submitting}>
        {t("sendEnquiry")} →
      </Button>
    </form>
  );
}

function dialFor(iso: string): string {
  const codes: Record<string, string> = {
    LB: "961",
    US: "1",
    GB: "44",
    FR: "33",
    DE: "49",
    AE: "971",
    SA: "966",
  };
  return codes[iso] ?? "1";
}
