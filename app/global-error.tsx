"use client";

import * as React from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

/**
 * 500 fallback per 15_legal_and_utility.md.
 *
 * Lives as `app/global-error.tsx` so it catches errors from anywhere in
 * the tree (the root layout included). Auto-retries once after 3s — if
 * that succeeds, the user never sees this page; otherwise they see it
 * and can choose to retry manually.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [autoRetried, setAutoRetried] = React.useState(false);
  const [errorRef] = React.useState(() => error.digest ?? Math.random().toString(36).slice(2, 10));

  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  React.useEffect(() => {
    if (autoRetried) return;
    const id = window.setTimeout(() => {
      setAutoRetried(true);
      reset();
    }, 3000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRetried]);

  return (
    <html lang="en">
      <body>
        <main className="bg-surface-subtle flex min-h-screen flex-col font-sans">
          <header>
            <div className="mx-auto flex h-14 items-center justify-center px-5 sm:px-10">
              <Link
                href="/"
                aria-label="Wheels Rent A Car home"
                className="text-ink-100 text-2xl font-bold"
              >
                Wheels
              </Link>
            </div>
          </header>

          <section className="flex flex-1 items-center justify-center px-5 py-12 sm:py-16">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <span aria-hidden="true" className="text-6xl">
                ⚠️
              </span>
              <p className="text-ink-100 text-sm tracking-wider uppercase">500</p>
              <h1 className="text-ink-95 text-3xl font-bold">Something went wrong on our end.</h1>
              <p className="text-ink-60">We&apos;re working on it. Please try again in a moment.</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="bg-ink-100 text-paper hover:bg-ink-80 rounded-md px-5 py-2.5 text-sm font-semibold"
                >
                  Try again
                </button>
                <Link
                  href="/"
                  className="text-ink-100 px-2 py-2.5 text-sm font-semibold hover:underline"
                >
                  Back to home
                </Link>
              </div>
              <p className="text-ink-50 mt-4 font-mono text-xs">ref: {errorRef}</p>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
