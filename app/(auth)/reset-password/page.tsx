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
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { useSession } from "@/hooks/useSession";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword, session, ready } = useSession();

  const callbackError = searchParams?.get("error");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // The recovery link routes through /api/auth/callback, which establishes a
  // session before forwarding here. No valid recovery session (and not still
  // hydrating) means the link was bad, expired, or already consumed.
  const invalidLink = Boolean(callbackError) || (ready && !session);

  if (invalidLink) {
    return (
      <AuthCard
        title={t("reset.invalidTitle")}
        subtitle={t("reset.invalidSubtitle")}
        footer={
          <Link href="/forgot-password" className="text-ink-100 underline-offset-2 hover:underline">
            {t("reset.requestNewLink")} →
          </Link>
        }
      >
        <Button asChild variant="primary" size="md" fullWidth>
          <Link href="/forgot-password">{t("reset.requestNewLink")}</Link>
        </Button>
      </AuthCard>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8 || scorePassword(password) < 1) {
      setError(t("reset.passwordWeak"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.passwordsMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(password);
      toast.success(t("reset.updated"));
      router.push("/account");
    } catch {
      setError(t("reset.linkInvalid"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={t("reset.title")}
      footer={
        <Link href="/login" className="text-ink-100 underline-offset-2 hover:underline">
          {t("reset.backToSignIn")} →
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label={t("reset.newPassword")} required>
          {({ id }) => (
            <>
              <Input
                id={id}
                type={show ? "text" : "password"}
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
        <Field label={t("reset.confirmNewPassword")} required>
          {({ id }) => (
            <Input
              id={id}
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" variant="cta" size="lg" fullWidth loading={submitting}>
          {t("reset.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
