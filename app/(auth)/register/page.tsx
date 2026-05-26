"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim()) e.lastName = "Last name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = "Enter a valid email.";
    if (password.length < 8) e.password = "Password must be at least 8 characters.";
    else if (scorePassword(password) < 1) e.password = "Password is too weak.";
    if (!terms) e.terms = "Please accept the Terms & Conditions.";
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
      await signUp({
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
      router.push(searchParams?.get("redirect") ?? "/account");
    } catch {
      setErrors({ form: "We couldn't create your account. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create account."
      subtitle="It takes 30 seconds. We'll save your details for next time."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-ink-100 underline-offset-2 hover:underline">
            Sign in →
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" required error={errors.firstName}>
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
          <Field label="Last name" required error={errors.lastName}>
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
        <Field label="Email" required error={errors.email}>
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
        <Field label="Password" required error={errors.password}>
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
                    aria-label={show ? "Hide password" : "Show password"}
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
        <Field label="Mobile (optional)" helper="We'll use this for WhatsApp updates.">
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
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" className="text-ink-100 underline-offset-2 hover:underline">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-ink-100 underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </>
          }
        />
        {errors.terms ? <ErrorText>{errors.terms}</ErrorText> : null}
        <Checkbox
          checked={marketing}
          onCheckedChange={(c) => setMarketing(c === true)}
          label="Send me occasional updates from Wheels."
        />
        {errors.form ? <ErrorText>{errors.form}</ErrorText> : null}
        <Button type="submit" variant="cta" size="lg" fullWidth loading={submitting}>
          Create account
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
