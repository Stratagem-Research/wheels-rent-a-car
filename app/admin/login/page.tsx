"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { isSignedIn, signIn } from "@/lib/admin/auth";

/*
 * /admin/login — staging-only credential form.
 *
 * Hardcoded `admin / admin123` per the Phase 12 brief (see `lib/admin/auth.ts`).
 * Already-signed-in visitors redirect straight to /admin.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isSignedIn()) router.replace("/admin");
  }, [router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const ok = signIn(username, password);
    if (!ok) {
      setSubmitting(false);
      setError("Invalid username or password.");
      return;
    }
    router.replace("/admin");
  };

  return (
    <main className="bg-ink-05 grid min-h-screen place-items-center px-5 py-12">
      <div className="bg-paper border-border w-full max-w-md rounded-2xl border p-8 sm:p-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="bg-ink-100 text-paper inline-flex size-12 items-center justify-center rounded-full">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-ink-60 overline">Wheels admin</p>
            <h1 className="display-md text-ink-100 text-[clamp(28px,4vw,40px)] leading-[1.05]">
              Sign in.
            </h1>
            <p className="body-sm text-ink-60">
              Staging credentials only. Real auth replaces this before launch.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
          <Field label="Username" required>
            {({ id }) => (
              <Input
                id={id}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}
          </Field>
          <Field label="Password" required>
            {({ id }) => (
              <Input
                id={id}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Button type="submit" variant="primary" size="lg" loading={submitting} fullWidth>
            Sign in
          </Button>
          <p className="label-sm text-ink-50 mt-2 text-center">
            Hint for the demo: <code className="mono-md">admin</code> /{" "}
            <code className="mono-md">admin123</code>
          </p>
        </form>
      </div>
    </main>
  );
}
