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

/*
 * Chauffeur enquiry form — INK & SIGNAL.
 *
 * Mirrors the EnquiryFormLongTerm shape (same primitives, same red `cta`
 * submit, same inline `LeadFormSuccess` state, same WhatsApp fallback on
 * error). Chauffeur-specific fields: service type, trip date, passenger
 * count, pickup location, vehicle class.
 */

const SERVICE_TYPES = ["airport", "day-trip", "by-the-hour"] as const;
type ServiceType = (typeof SERVICE_TYPES)[number];
const SERVICE_LABELS: Record<ServiceType, string> = {
  airport: "Airport transfer",
  "day-trip": "Day trip",
  "by-the-hour": "By the hour",
};

const VEHICLE_CLASSES = ["sedan", "suv", "van"] as const;

interface FormState {
  fullName: string;
  email: string;
  phone: PhoneValue;
  serviceType: ServiceType;
  vehicleClass: string;
  tripDate: string;
  passengers: string;
  pickupLocation: string;
  notes: string;
  marketing: boolean;
}

export interface EnquiryFormChauffeurProps {
  /** Pre-selected service type when a category card is clicked. */
  initialServiceType?: ServiceType;
  formId?: string;
}

export function EnquiryFormChauffeur({
  initialServiceType = "airport",
  formId = "enquiry",
}: EnquiryFormChauffeurProps) {
  const [form, setForm] = React.useState<FormState>({
    fullName: "",
    email: "",
    phone: { countryIso: "LB", national: "" },
    serviceType: initialServiceType,
    vehicleClass: "sedan",
    tripDate: "",
    passengers: "",
    pickupLocation: "",
    notes: "",
    marketing: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setForm((f) => ({ ...f, serviceType: initialServiceType }));
  }, [initialServiceType]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.phone.national.trim()) e.phone = "Mobile number is required.";
    if (!form.tripDate) e.tripDate = "Tell us when the trip is.";
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
      await api.post(endpoints.leadsChauffeur, {
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: `+${dialFor(form.phone.countryIso)}${form.phone.national.replace(/\D/g, "")}`,
        serviceType: form.serviceType,
        vehicleClass: form.vehicleClass,
        tripDate: form.tripDate,
        passengers: form.passengers ? Number(form.passengers) : undefined,
        pickupLocation: form.pickupLocation.trim() || undefined,
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
        <Field label="Service type" required>
          {({ id }) => (
            <Select
              id={id}
              value={form.serviceType}
              onChange={(e) =>
                setForm((f) => ({ ...f, serviceType: e.target.value as ServiceType }))
              }
            >
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_LABELS[s]}
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
                  {c}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Trip date" required error={errors.tripDate}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="date"
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.tripDate}
              onChange={(e) => setForm((f) => ({ ...f, tripDate: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Passengers (optional)">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              max={20}
              placeholder="e.g. 3"
              value={form.passengers}
              onChange={(e) => setForm((f) => ({ ...f, passengers: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Pickup location (optional)">
          {({ id }) => (
            <Input
              id={id}
              placeholder="Hotel name or address"
              value={form.pickupLocation}
              onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))}
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
