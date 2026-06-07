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

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useSession();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState(searchParams?.get("email") ?? "");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [phone, setPhone] = React.useState<PhoneValue>({ countryIso: "LB", national: "" });
  const [terms, setTerms] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);

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
      track(EVENTS.ACCOUNT_CREATED);
      if (result.requiresEmailConfirmation) {
        setConfirmationSent(true);
        return;
      }
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
