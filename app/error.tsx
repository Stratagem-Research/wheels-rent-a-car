"use client";

import * as React from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/Button";
import { useWhatsAppHref } from "@/components/providers/ContactSettingsProvider";

/**
 * Per-route error boundary per 15_legal_and_utility.md.
 *
 * Catches runtime errors inside the marketing/booking/account layouts so
 * the user keeps the global header + footer for navigation. Auto-retries
 * once after 3 seconds (if it works, the user never sees this); otherwise
 * surfaces a friendly message + retry button + Sentry error ref.
 *
 * Root-level failures (the layout itself crashing) fall through to
 * app/global-error.tsx instead.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const whatsAppHref = useWhatsAppHref();
  const [autoRetried, setAutoRetried] = React.useState(false);
  // Lazy state init keeps the ref stable across re-renders and satisfies
  // react-hooks/purity (Math.random is impure during render).
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
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-5 py-16 text-center sm:py-24">
      <p className="text-ink-60 overline">500</p>
      <h1 className="display-lg text-ink-100 text-[clamp(48px,7vw,72px)] leading-[0.98]">
        Something went wrong.
      </h1>
      <p className="lead-lg text-ink-60 max-w-md">
        {autoRetried
          ? "We tried again automatically. If you're still stuck, retry below or message us on WhatsApp."
          : "We're working on it. Trying again in a moment…"}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button variant="cta" size="lg" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="secondary" size="md">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
      <p className="label-md text-ink-50 mt-3">
        Or chat with us on{" "}
        <a
          href={whatsAppHref("default")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-100 underline-offset-4 hover:underline"
        >
          WhatsApp →
        </a>
      </p>
      <p className="mono-md text-ink-50 mt-4">ref: {errorRef}</p>
    </section>
  );
}
