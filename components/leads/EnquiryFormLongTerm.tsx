"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
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

const DURATIONS = ["1", "3", "6", "12"] as const;
type Duration = (typeof DURATIONS)[number];

const VEHICLE_CLASSES = ["economy", "compact", "sedan", "suv", "7-seater", "luxury"] as const;

interface FormState {
  fullName: string;
  email: string;
  phone: PhoneValue;
  company: string;
  duration: Duration;
  vehicleClass: string;
  startDate: string;
  deliveryAddress: string;
  notes: string;
  marketing: boolean;
}

export interface EnquiryFormLongTermProps {
  /** Pre-selected duration when a tier card is clicked. */
  initialDuration?: Duration;
  /** When set, the parent should scroll to the form on mount. */
  formId?: string;
}

export function EnquiryFormLongTerm({
  initialDuration = "1",
  formId = "enquiry",
}: EnquiryFormLongTermProps) {
  const t = useTranslations("leads");
  const tCat = useTranslations("vehicleCategories");
  const [form, setForm] = React.useState<FormState>({
    fullName: "",
    email: "",
    phone: { countryIso: "LB", national: "" },
    company: "",
    duration: initialDuration,
    vehicleClass: "sedan",
    startDate: "",
    deliveryAddress: "",
    notes: "",
    marketing: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  // Keep duration in sync when parent updates initialDuration (e.g. tier CTA click).
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setForm((f) => ({ ...f, duration: initialDuration }));
  }, [initialDuration]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = t("fullNameRequired");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = t("emailInvalid");
    if (!form.phone.national.trim()) e.phone = t("mobileRequired");
    if (!form.startDate) e.startDate = t("longTerm.startDateRequired");
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
      await api.post(endpoints.leadsLongTerm, {
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: `+${dialFor(form.phone.countryIso)}${form.phone.national.replace(/\D/g, "")}`,
        company: form.company.trim() || undefined,
        duration: form.duration,
        vehicleClasses: [form.vehicleClass],
        startDate: form.startDate,
        deliveryAddress: form.deliveryAddress.trim() || undefined,
        notes: form.notes.trim() || undefined,
        marketing: form.marketing,
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
        <Field label={t("companyOptional")}>
          {({ id }) => (
            <Input
              id={id}
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            />
          )}
        </Field>
        <Field label={t("longTerm.duration")} required>
          {({ id }) => (
            <Select
              id={id}
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value as Duration }))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {t("longTerm.durationMonths", { count: Number(d) })}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("longTerm.vehicleClass")} required>
          {({ id }) => (
            <Select
              id={id}
              value={form.vehicleClass}
              onChange={(e) => setForm((f) => ({ ...f, vehicleClass: e.target.value }))}
            >
              {VEHICLE_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {tCat(c)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("longTerm.startDate")} required error={errors.startDate}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="date"
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          )}
        </Field>
        <Field label={t("longTerm.deliveryAddressOptional")}>
          {({ id }) => (
            <Input
              id={id}
              value={form.deliveryAddress}
              onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
            />
          )}
        </Field>
      </div>
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
