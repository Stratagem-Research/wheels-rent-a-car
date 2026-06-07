"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { PhoneInput, type PhoneValue } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LeadFormSuccess } from "@/components/leads/SuccessState";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const SUBJECTS = ["general", "booking", "damage", "corporate", "other"] as const;
const SUBJECT_KEYS: Record<(typeof SUBJECTS)[number], string> = {
  general: "subjectGeneral",
  booking: "subjectBooking",
  damage: "subjectDamage",
  corporate: "subjectCorporate",
  other: "subjectOther",
};

interface FormState {
  fullName: string;
  email: string;
  phone: PhoneValue;
  subject: (typeof SUBJECTS)[number];
  bookingRef: string;
  message: string;
}

export function ContactForm({ formId = "contact-form" }: { formId?: string }) {
  const t = useTranslations("leads");
  const tForm = useTranslations("leads.contactForm");
  const [form, setForm] = React.useState<FormState>({
    fullName: "",
    email: "",
    phone: { countryIso: "LB", national: "" },
    subject: "general",
    bookingRef: "",
    message: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = t("fullNameRequired");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = t("emailInvalid");
    if (!form.message.trim()) e.message = tForm("messageRequired");
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
      setErrors({ form: tForm("submitError") });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <LeadFormSuccess message={tForm("success")} />;

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
        <Field label={t("mobileOptional")}>
          {({ id }) => (
            <PhoneInput
              id={id}
              value={form.phone}
              onValueChange={(phone) => setForm((f) => ({ ...f, phone }))}
            />
          )}
        </Field>
        <Field label={tForm("subject")} required>
          {({ id }) => (
            <Select
              id={id}
              value={form.subject}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject: e.target.value as FormState["subject"] }))
              }
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {tForm(SUBJECT_KEYS[s])}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          label={tForm("bookingRefOptional")}
          helper={tForm("bookingRefHelper")}
          className="sm:col-span-2"
        >
          {({ id }) => (
            <Input
              id={id}
              placeholder={tForm("bookingRefPlaceholder")}
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
      <Field label={tForm("yourMessage")} required error={errors.message}>
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
        {tForm("sendMessage")} →
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
