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

/**
 * Corporate enquiry form — INK & SIGNAL.
 *
 * Mirrors `EnquiryFormLongTerm` (same primitives, same red `cta` submit,
 * same `LeadFormSuccess` state). Corporate-specific fields: company,
 * job title, monthly volume estimate, tier, urgency.
 *
 * POSTs to `/api/leads/corporate` (Next.js route handler).
 */

/**
 * Default tier IDs mirror the seeded fixture in `lib/api/mocks/fixtures/catalog.ts`.
 * Admin-created tiers carry custom IDs; the form falls back to "co-growth"
 * when the incoming `initialTier` doesn't match a known label, and shows a
 * generic option label inside the select.
 */
const TIER_LABEL_KEYS: Record<string, string> = {
  "co-starter": "tierStarter",
  "co-growth": "tierGrowth",
  "co-enterprise": "tierEnterprise",
};
const DEFAULT_TIER_IDS = Object.keys(TIER_LABEL_KEYS);

const URGENCY_OPTIONS = ["this-week", "this-month", "this-quarter", "exploring"] as const;
type Urgency = (typeof URGENCY_OPTIONS)[number];
const URGENCY_LABEL_KEYS: Record<Urgency, string> = {
  "this-week": "urgencyWeek",
  "this-month": "urgencyMonth",
  "this-quarter": "urgencyQuarter",
  exploring: "urgencyExploring",
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
  const t = useTranslations("leads");
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
    if (!form.company.trim()) e.company = t("corporate.companyRequired");
    if (!form.fullName.trim()) e.fullName = t("fullNameRequired");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = t("corporate.workEmailInvalid");
    if (!form.phone.national.trim()) e.phone = t("mobileRequired");
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
      setErrors({ form: t("submitError") });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return <LeadFormSuccess />;

  return (
    <form id={formId} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("corporate.company")} required error={errors.company}>
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
        <Field label={t("corporate.jobTitleOptional")}>
          {({ id }) => (
            <Input
              id={id}
              autoComplete="organization-title"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
            />
          )}
        </Field>
        <Field label={t("corporate.workEmail")} required error={errors.email}>
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
        <Field label={t("corporate.tier")} required>
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
              {DEFAULT_TIER_IDS.map((id) => (
                <option key={id} value={id}>
                  {t(`corporate.${TIER_LABEL_KEYS[id]}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("corporate.urgency")}>
          {({ id }) => (
            <Select
              id={id}
              value={form.urgency}
              onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value as Urgency }))}
            >
              {URGENCY_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {t(`corporate.${URGENCY_LABEL_KEYS[u]}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Field label={t("corporate.notes")}>
        {({ id }) => (
          <Textarea
            id={id}
            rows={4}
            placeholder={t("corporate.notesPlaceholder")}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        )}
      </Field>
      <Checkbox
        checked={form.marketing}
        onCheckedChange={(c) => setForm((f) => ({ ...f, marketing: c === true }))}
        label={t("corporate.marketing")}
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
