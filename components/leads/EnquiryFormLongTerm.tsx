"use client";

import * as React from "react";
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
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.phone.national.trim()) e.phone = "Mobile number is required.";
    if (!form.startDate) e.startDate = "Tell us when you'd like to start.";
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
      setErrors({
        form: "We couldn't submit your enquiry. Please try again or chat with us on WhatsApp.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <LeadFormSuccess />;

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.fullName}>
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
        <Field label="Email" required error={errors.email}>
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
        <Field label="Mobile" required error={errors.phone}>
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
        <Field label="Company (optional)">
          {({ id }) => (
            <Input
              id={id}
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Duration" required>
          {({ id }) => (
            <Select
              id={id}
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value as Duration }))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} month{d === "1" ? "" : "s"}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Vehicle class" required>
          {({ id }) => (
            <Select
              id={id}
              value={form.vehicleClass}
              onChange={(e) => setForm((f) => ({ ...f, vehicleClass: e.target.value }))}
            >
              {VEHICLE_CLASSES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c.replace("-", " ")}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Start date" required error={errors.startDate}>
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
        <Field label="Delivery address (optional)">
          {({ id }) => (
            <Input
              id={id}
              value={form.deliveryAddress}
              onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
            />
          )}
        </Field>
      </div>
      <Field label="Anything else we should know?">
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
        label="I want occasional updates from Wheels."
      />
      {errors.form ? <ErrorText>{errors.form}</ErrorText> : null}
      <Button type="submit" variant="cta" size="lg" loading={submitting}>
        Send my enquiry →
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
