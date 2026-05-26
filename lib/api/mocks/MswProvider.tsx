"use client";

import * as React from "react";

/**
 * MSW browser provider — starts the service worker once on first mount.
 * Wraps the children in a Suspense-friendly state: render only after the
 * worker is ready (or immediately, when mocks are disabled).
 *
 * Toggle via NEXT_PUBLIC_MOCK_API: "true" (default in dev) starts the worker,
 * "false" lets requests fall through to the real backend at NEXT_PUBLIC_API_BASE_URL.
 */
export function MswProvider({ children }: { children: React.ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_MOCK_API !== "false";
  const [ready, setReady] = React.useState(!enabled);

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      const { worker } = await import("@/lib/api/mocks/browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
      });
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!ready) return null;
  return <>{children}</>;
}
