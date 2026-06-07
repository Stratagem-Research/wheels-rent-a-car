"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { useSession } from "@/hooks/useSession";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const { forgotPassword } = useSession();
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError(t("emailInvalid"));
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email);
      // Per 14_auth.md: always show success to avoid email enumeration.
      setSent(true);
    } catch {
      // Per spec, surface success regardless of network error to avoid leaks.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={sent ? t("forgot.sentTitle") : t("forgot.title")}
      subtitle={sent ? t("forgot.sentSubtitle", { email }) : t("forgot.subtitle")}
      footer={
        <>
          {t("forgot.remembered")}{" "}
          <Link href="/login" className="text-ink-100 underline-offset-2 hover:underline">
            {t("forgot.signIn")} →
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="bg-success-bg text-success flex items-start gap-2 rounded-md p-4">
          <Check className="size-5 shrink-0" aria-hidden="true" />
          <span className="body-md">{t("forgot.sentBody")}</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field label={t("email")} required>
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
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Button type="submit" variant="cta" size="lg" fullWidth loading={submitting}>
            {t("forgot.submit")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
