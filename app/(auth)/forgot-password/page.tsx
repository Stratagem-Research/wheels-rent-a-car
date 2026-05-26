"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { useSession } from "@/hooks/useSession";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useSession();
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email.");
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
      title={sent ? "Check your inbox." : "Forgot password?"}
      subtitle={
        sent
          ? `If we have an account for ${email}, a reset link is on its way. It expires in 30 minutes.`
          : "Enter your email — we'll send you a reset link."
      }
      footer={
        <>
          Remembered?{" "}
          <Link href="/login" className="text-ink-100 underline-offset-2 hover:underline">
            Sign in →
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="bg-success-bg text-success flex items-start gap-2 rounded-md p-4">
          <Check className="size-5 shrink-0" aria-hidden="true" />
          <span className="body-md">
            Reset link sent. Tap the link in the email to choose a new password.
          </span>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <Field label="Email" required>
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
            Send reset link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
