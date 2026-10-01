"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Modal, ModalContent, ModalDescription, ModalTitle } from "@/components/ui/Modal";
import { PhoneInput, type PhoneValue } from "@/components/ui/PhoneInput";
import { Textarea } from "@/components/ui/Textarea";
import { LeadFormSuccess } from "@/components/leads/SuccessState";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

/**
 * "Request Price" form — shown instead of the booking CTA on fleet cards for
 * manual cars with no admin-set daily rate (00_global.md has no spec for
 * this yet; see docs/Implementation/02_fleet_browse.md "Request Price" note).
 * Submits to price_request_enquiries, surfaced in the admin Leads inbox.
 */
export function RequestPriceModal({
  open,
  onOpenChange,
  vehicleId,
  vehicleLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleLabel: string;
}) {
  const t = useTranslations("leads");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState<PhoneValue>({ countryIso: "LB", national: "" });
  const [daysNeeded, setDaysNeeded] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = t("emailInvalid");
    if (!phone.national.trim()) e.phone = t("mobileRequired");
    const days = Number(daysNeeded);
    if (!daysNeeded.trim() || !Number.isInteger(days) || days < 1) {
      e.daysNeeded = t("priceRequest.daysNeededRequired");
    }
    return e;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      await api.post(endpoints.leadsPriceRequest, {
        vehicleId,
        vehicleTitle: vehicleLabel,
        email: email.trim().toLowerCase(),
        phone: `+${dialFor(phone.countryIso)}${phone.national.replace(/\D/g, "")}`,
        daysNeeded: Number(daysNeeded),
        notes: notes.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      setErrors({ form: t("submitError") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalTitle className={submitted ? "sr-only" : undefined}>
          {t("priceRequest.title")}
        </ModalTitle>
        <ModalDescription className={submitted ? "sr-only" : undefined}>
          {t("priceRequest.description", { vehicle: vehicleLabel })}
        </ModalDescription>
        {submitted ? (
          <div className="mt-2">
            <LeadFormSuccess message={t("priceRequest.success")} />
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <Field label={t("email")} required error={errors.email}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="email"
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>
            <Field label={t("mobile")} required error={errors.phone}>
              {({ id, describedBy, invalid }) => (
                <PhoneInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={phone}
                  onValueChange={setPhone}
                />
              )}
            </Field>
            <Field label={t("priceRequest.daysNeeded")} required error={errors.daysNeeded}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  type="number"
                  min={1}
                  max={365}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={daysNeeded}
                  onChange={(e) => setDaysNeeded(e.target.value)}
                />
              )}
            </Field>
            <Field label={t("notes")}>
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={3}
                  placeholder={t("priceRequest.notesPlaceholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              )}
            </Field>
            {errors.form ? <ErrorText>{errors.form}</ErrorText> : null}
            <Button type="submit" variant="cta" size="lg" loading={submitting}>
              {t("priceRequest.submit")}
            </Button>
          </form>
        )}
      </ModalContent>
    </Modal>
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
