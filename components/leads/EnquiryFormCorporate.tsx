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

/**
 * Corporate enquiry form — INK & SIGNAL.
 *
 * Mirrors `EnquiryFormLongTerm` (same primitives, same red `cta` submit,
 * same `LeadFormSuccess` state). Corporate-specific fields: company,
 * job title, monthly volume estimate, tier, urgency.
 *
 * POSTs to `/api/leads/corporate` — the MSW handler in
 * `lib/api/mocks/handlers.ts` already maps this to a stubbed Lead id;
 * Wheels' backend will replace it with a real lead-capture endpoint.
 */

/**
 * Default tier IDs mirror the seeded fixture in `lib/api/mocks/fixtures/catalog.ts`.
 * Admin-created tiers carry custom IDs; the form falls back to "co-growth"
 * when the incoming `initialTier` doesn't match a known label, and shows a
 * generic option label inside the select.
 */
const KNOWN_TIER_LABELS: Record<string, string> = {
  "co-starter": "Starter (1-2 cars / month)",
  "co-growth": "Growth (3-10 cars / month)",
  "co-enterprise": "Enterprise (10+ cars / month)",
};
const DEFAULT_TIER_IDS = Object.keys(KNOWN_TIER_LABELS);

const URGENCY_OPTIONS = ["this-week", "this-month", "this-quarter", "exploring"] as const;
type Urgency = (typeof URGENCY_OPTIONS)[number];
const URGENCY_LABELS: Record<Urgency, string> = {
  "this-week": "Need cars this week",
  "this-month": "Within a month",
  "this-quarter": "Within a quarter",
  exploring: "Just exploring",
};

interface FormState {
  company: string;
  fullName: string;
  jobTitle: string;
  email: string;
  phone: PhoneValue;
  tier: string;
  urgency: Urgency;
  notes: string;
  marketing: boolean;
}

export interface EnquiryFormCorporateProps {
  /** Pre-selected tier when a card CTA is clicked. */
  initialTier?: string;
  formId?: string;
}

export function EnquiryFormCorporate({
  initialTier = "co-growth",
  formId = "enquiry",
}: EnquiryFormCorporateProps) {
  const [form, setForm] = React.useState<FormState>({
    company: "",
    fullName: "",
    jobTitle: "",
    email: "",
    phone: { countryIso: "LB", national: "" },
    tier: initialTier,
    urgency: "this-month",
    notes: "",
    marketing: false,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setForm((f) => ({ ...f, tier: initialTier }));
  }, [initialTier]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.company.trim()) e.company = "Company name is required.";
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Enter a valid work email.";
    if (!form.phone.national.trim()) e.phone = "Mobile number is required.";
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
      await api.post(endpoints.leadsCorporate, {
        company: form.company.trim(),
        name: form.fullName.trim(),
        jobTitle: form.jobTitle.trim() || undefined,
        email: form.email.trim().toLowerCase(),
        mobile: `+${dialFor(form.phone.countryIso)}${form.phone.national.replace(/\D/g, "")}`,
        tier: form.tier,
        urgency: form.urgency,
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
        <Field label="Company" required error={errors.company}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="organization"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            />
          )}
        </Field>
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
        <Field label="Job title (optional)">
          {({ id }) => (
            <Input
              id={id}
              autoComplete="organization-title"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Work email" required error={errors.email}>
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
        <Field label="Tier" required>
          {({ id }) => (
            <Select
              id={id}
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
            >
              {/* When `initialTier` is a custom (admin-created) ID, surface
               * it as the first option so it can be saved without losing
               * the selection. */}
              {!DEFAULT_TIER_IDS.includes(form.tier) ? (
                <option value={form.tier}>{form.tier}</option>
              ) : null}
              {DEFAULT_TIER_IDS.map((t) => (
                <option key={t} value={t}>
                  {KNOWN_TIER_LABELS[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Urgency">
          {({ id }) => (
            <Select
              id={id}
              value={form.urgency}
              onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value as Urgency }))}
            >
              {URGENCY_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {URGENCY_LABELS[u]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label="Tell us about your needs">
        {({ id }) => (
          <Textarea
            id={id}
            rows={4}
            placeholder="Fleet size, vehicle categories, typical rental duration, contract preferences..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        )}
      </Field>
      <Checkbox
        checked={form.marketing}
        onCheckedChange={(c) => setForm((f) => ({ ...f, marketing: c === true }))}
        label="I want occasional B2B updates from Wheels."
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
