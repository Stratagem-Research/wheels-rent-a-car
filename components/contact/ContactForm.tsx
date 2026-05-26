"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { PhoneInput, type PhoneValue } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LeadFormSuccess } from "@/components/leads/SuccessState";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const SUBJECTS = [
  "General enquiry",
  "Booking question",
  "Damage report",
  "Corporate",
  "Other",
] as const;

interface FormState {
  fullName: string;
  email: string;
  phone: PhoneValue;
  subject: (typeof SUBJECTS)[number];
  bookingRef: string;
  message: string;
}

export function ContactForm({ formId = "contact-form" }: { formId?: string }) {
  const [form, setForm] = React.useState<FormState>({
    fullName: "",
    email: "",
    phone: { countryIso: "LB", national: "" },
    subject: "General enquiry",
    bookingRef: "",
    message: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.message.trim()) e.message = "Tell us how we can help.";
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
      await api.post(endpoints.contact, {
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.phone.national
          ? `+${dialFor(form.phone.countryIso)}${form.phone.national.replace(/\D/g, "")}`
          : undefined,
        subject: form.subject,
        bookingRef: form.bookingRef.trim() || undefined,
        message: form.message.trim(),
      });
      setSubmitted(true);
    } catch {
      setErrors({ form: "We couldn't send your message. Try WhatsApp instead." });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <LeadFormSuccess message="Thanks — we'll reply within 4 hours." />;

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
        <Field label="Mobile (optional)">
          {({ id }) => (
            <PhoneInput
              id={id}
              value={form.phone}
              onValueChange={(phone) => setForm((f) => ({ ...f, phone }))}
            />
          )}
        </Field>
        <Field label="Subject" required>
          {({ id }) => (
            <Select
              id={id}
              value={form.subject}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject: e.target.value as FormState["subject"] }))
              }
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          label="Booking reference (optional)"
          helper="If your question is about a specific booking."
          className="sm:col-span-2"
        >
          {({ id }) => (
            <Input
              id={id}
              placeholder="WRC-XXXXXX-XXXX"
              value={form.bookingRef}
              onChange={(e) => setForm((f) => ({ ...f, bookingRef: e.target.value.toUpperCase() }))}
              className="mono-md uppercase"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          )}
        </Field>
      </div>
      <Field label="Your message" required error={errors.message}>
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            rows={5}
            aria-describedby={describedBy}
            invalid={invalid}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
        )}
      </Field>
      {errors.form ? <ErrorText>{errors.form}</ErrorText> : null}
      <Button type="submit" variant="primary" size="md" loading={submitting} className="self-start">
        Send message →
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
