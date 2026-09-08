"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import {
  PasswordStrengthIndicator,
  scorePassword,
} from "@/components/account/PasswordStrengthIndicator";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { PhoneInput, type PhoneValue } from "@/components/ui/PhoneInput";
import { useSession } from "@/hooks/useSession";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import { phoneValueFromStored } from "@/lib/booking/phone";
import { endpoints } from "@/lib/api/endpoints";
import {
  clearPendingLicence,
  readPendingLicence,
  clearPendingAdditionalDriver,
  readPendingAdditionalDriver,
  clearPendingIdentity,
  readPendingIdentity,
} from "@/lib/booking/pending-licence";

const DRAFT_KEY = "wheels.register.draft";

function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

function saveDraft(fields: Record<string, string>) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(fields)); } catch { /* quota */ }
}

function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useSession();

  const draft = typeof window !== "undefined" ? readDraft() : null;

  // Prefilled from a just-completed guest booking (see the confirmation
  // page's "Create account" CTA) so this is genuinely one click, not a
  // second round of typing what checkout already collected.
  const [firstName, setFirstName] = React.useState(draft?.firstName ?? searchParams?.get("firstName") ?? "");
  const [lastName, setLastName] = React.useState(draft?.lastName ?? searchParams?.get("lastName") ?? "");
  const [email, setEmail] = React.useState(draft?.email ?? searchParams?.get("email") ?? "");
  const [password, setPassword] = React.useState(draft?.password ?? "");
  const [show, setShow] = React.useState(false);
  const [phone, setPhone] = React.useState<PhoneValue>(() =>
    draft?.phoneNational
      ? { countryIso: draft.phoneIso ?? "LB", national: draft.phoneNational }
      : phoneValueFromStored(searchParams?.get("phone")),
  );
  const [terms, setTerms] = React.useState(draft?.terms === "true");
  const [marketing, setMarketing] = React.useState(draft?.marketing === "true");

  // Persist form to sessionStorage on every change so navigating to
  // terms/privacy and back restores all fields.
  React.useEffect(() => {
    saveDraft({
      firstName,
      lastName,
      email,
      password,
      phoneIso: phone.countryIso,
      phoneNational: phone.national ?? "",
      terms: String(terms),
      marketing: String(marketing),
    });
  }, [firstName, lastName, email, password, phone, terms, marketing]);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmationSent, setConfirmationSent] = React.useState(false);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = t("register.firstNameRequired");
    if (!lastName.trim()) e.lastName = t("register.lastNameRequired");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = t("emailInvalid");
    if (password.length < 8) e.password = t("register.passwordMin");
    else if (scorePassword(password) < 1) e.password = t("register.passwordWeak");
    if (!terms) e.terms = t("register.acceptTerms");
    return e;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus?.({ preventScroll: true });
      return;
    }
    setSubmitting(true);
    try {
      const result = await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        mobile: phone.national
          ? `+${dialFor(phone.countryIso)}${phone.national.replace(/\D/g, "")}`
          : undefined,
        marketing,
      });
      clearDraft();
      track(EVENTS.ACCOUNT_CREATED);
      if (result.requiresEmailConfirmation) {
        setConfirmationSent(true);
        return;
      }
      // Booking checkout already collected the licence number/dates/country
      // and, when uploaded, the actual scan photos (see the confirmation
      // page's "Create account" CTA + lib/booking/pending-licence) — carry
      // all of it into the new profile so nothing has to be typed or
      // re-uploaded a second time. Best-effort: never blocks account
      // creation if it fails.
      void saveLicenceFromBooking();
      void saveIdentityFromBooking();
      void saveAdditionalDriverFromBooking();
      router.push(searchParams?.get("redirect") ?? "/account");
    } catch {
      setErrors({ form: t("register.formError") });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationSent) {
    return (
      <AuthCard
        title={t("register.confirmTitle")}
        subtitle={t("register.confirmSubtitle", { email: email.trim().toLowerCase() })}
        footer={
          <Link href="/login" className="text-ink-100 underline-offset-2 hover:underline">
            {t("register.backToSignIn")} →
          </Link>
        }
      >
        <div className="bg-success-bg text-success rounded-md p-4">
          <span className="body-md">{t("register.confirmBody")}</span>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      footer={
        <>
          {t("register.alreadyHave")}{" "}
          <Link href="/login" className="text-ink-100 underline-offset-2 hover:underline">
            {t("register.signIn")} →
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("register.firstName")} required error={errors.firstName}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            )}
          </Field>
          <Field label={t("register.lastName")} required error={errors.lastName}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Field label={t("email")} required error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field label={t("password")} required error={errors.password}>
          {({ id, describedBy, invalid }) => (
            <>
              <Input
                id={id}
                type={show ? "text" : "password"}
                aria-describedby={describedBy}
                invalid={invalid}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? t("hidePassword") : t("showPassword")}
                    className="hover:text-ink-80 text-ink-60"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />
              <PasswordStrengthIndicator password={password} />
            </>
          )}
        </Field>
        <Field label={t("register.mobileOptional")} helper={t("register.mobileHelper")}>
          {({ id, describedBy }) => (
            <PhoneInput
              id={id}
              aria-describedby={describedBy}
              value={phone}
              onValueChange={setPhone}
            />
          )}
        </Field>
        <Checkbox
          checked={terms}
          onCheckedChange={(c) => setTerms(c === true)}
          label={t.rich("register.agreeTerms", {
            terms: (chunks) => (
              <Link href="/terms" className="text-ink-100 underline-offset-2 hover:underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="text-ink-100 underline-offset-2 hover:underline">
                {chunks}
              </Link>
            ),
          })}
        />
        {errors.terms ? <ErrorText>{errors.terms}</ErrorText> : null}
        <Checkbox
          checked={marketing}
          onCheckedChange={(c) => setMarketing(c === true)}
          label={t("register.marketing")}
        />
        {errors.form ? <ErrorText>{errors.form}</ErrorText> : null}
        <Button type="submit" variant="cta" size="lg" fullWidth loading={submitting}>
          {t("register.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}

/** Downloads a signed scan URL and returns it as a File for re-upload. */
async function urlToFile(url: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || "application/octet-stream" });
  } catch {
    return null;
  }
}

async function saveLicenceFromBooking(): Promise<void> {
  const pending = readPendingLicence();
  clearPendingLicence();
  if (!pending) return;
  const hasAnything =
    pending.licenceNumber || pending.licenceFrontUrl || pending.licenceBackUrl;
  if (!hasAnything) return;

  try {
    const [fileFront, fileBack] = await Promise.all([
      pending.licenceFrontUrl ? urlToFile(pending.licenceFrontUrl, "licence-front") : null,
      pending.licenceBackUrl ? urlToFile(pending.licenceBackUrl, "licence-back") : null,
    ]);
    const body = new FormData();
    body.set("type", "licence");
    body.set("number", pending.licenceNumber);
    body.set("issueDate", pending.licenceIssue);
    body.set("expiryDate", pending.licenceExpiry);
    body.set("issuingCountry", pending.licenceCountry);
    if (fileFront) body.set("fileFront", fileFront);
    if (fileBack) body.set("fileBack", fileBack);
    await fetch(endpoints.accountDocuments, { method: "POST", body, credentials: "same-origin" });
  } catch {
    // Best-effort — the customer can still upload their licence from
    // /account/documents; this never blocks account creation.
  }
}

async function saveIdentityFromBooking(): Promise<void> {
  const pending = readPendingIdentity();
  clearPendingIdentity();
  if (!pending) return;
  if (!pending.frontUrl && !pending.backUrl) return;

  try {
    const [fileFront, fileBack] = await Promise.all([
      pending.frontUrl ? urlToFile(pending.frontUrl, `${pending.type}-front`) : null,
      pending.backUrl ? urlToFile(pending.backUrl, `${pending.type}-back`) : null,
    ]);
    const body = new FormData();
    body.set("type", pending.type);
    body.set("number", "");
    body.set("issueDate", "");
    body.set("expiryDate", "");
    body.set("issuingCountry", pending.country || (pending.type === "id" ? "LB" : ""));
    if (pending.type === "id") {
      if (fileFront) body.set("fileFront", fileFront);
      if (fileBack) body.set("fileBack", fileBack);
    } else if (fileFront) {
      body.set("file", fileFront);
    }
    await fetch(endpoints.accountDocuments, { method: "POST", body, credentials: "same-origin" });
  } catch {
    // Best-effort — never blocks account creation.
  }
}

async function saveAdditionalDriverFromBooking(): Promise<void> {
  const pending = readPendingAdditionalDriver();
  clearPendingAdditionalDriver();
  if (!pending) return;
  const hasAnything = pending.firstName || pending.licenceFrontUrl || pending.licenceBackUrl;
  if (!hasAnything) return;

  try {
    const [fileFront, fileBack] = await Promise.all([
      pending.licenceFrontUrl
        ? urlToFile(pending.licenceFrontUrl, "additional-driver-front")
        : null,
      pending.licenceBackUrl ? urlToFile(pending.licenceBackUrl, "additional-driver-back") : null,
    ]);
    const body = new FormData();
    body.set("firstName", pending.firstName);
    body.set("lastName", pending.lastName);
    if (fileFront) body.set("fileFront", fileFront);
    if (fileBack) body.set("fileBack", fileBack);
    await fetch(endpoints.accountAdditionalDriver, {
      method: "POST",
      body,
      credentials: "same-origin",
    });
  } catch {
    // Best-effort — never blocks account creation.
  }
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
