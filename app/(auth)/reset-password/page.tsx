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
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { useSession } from "@/hooks/useSession";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useSession();

  const token = searchParams?.get("token") ?? "";
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!token) {
    return (
      <AuthCard
        title="Link expired or invalid"
        subtitle="Request a new reset link to set a fresh password."
        footer={
          <Link href="/forgot-password" className="text-ink-100 underline-offset-2 hover:underline">
            Request a new link →
          </Link>
        }
      >
        <Button asChild variant="primary" size="md" fullWidth>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8 || scorePassword(password) < 1) {
      setError("Choose a stronger password (8+ chars, mix of letters & numbers).");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      toast.success("Password updated.");
      router.push("/account");
    } catch {
      setError("That link is no longer valid. Request a new one.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Set a new password."
      footer={
        <Link href="/login" className="text-ink-100 underline-offset-2 hover:underline">
          Back to sign in →
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="New password" required>
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
        <Field label="Confirm new password" required>
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
          Save password
        </Button>
      </form>
    </AuthCard>
  );
}
