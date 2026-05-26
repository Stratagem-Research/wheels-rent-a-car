"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthCard } from "@/components/account/AuthCard";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { useSession } from "@/hooks/useSession";
import { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useSession();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const redirectTo = searchParams?.get("redirect") ?? "/account";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.push(redirectTo);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Email or password incorrect.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Sign in."
      subtitle="Welcome back."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="text-ink-100 underline-offset-4 hover:underline">
            Create an account →
          </Link>
        </>
      }
    >
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
              required
            />
          )}
        </Field>
        <Field label="Password" required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type={show ? "text" : "password"}
              autoComplete="current-password"
              aria-describedby={describedBy}
              invalid={invalid}
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
              required
            />
          )}
        </Field>
        <div className="-mt-2 text-right">
          <Link
            href="/forgot-password"
            className="label-md text-ink-100 hover:text-ink-80 underline-offset-2 hover:underline"
          >
            Forgot?
          </Link>
        </div>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" variant="cta" size="lg" fullWidth loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
