"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminMobileBar, AdminSidebar } from "@/components/admin/AdminSidebar";
import { isSignedIn } from "@/lib/admin/auth";

/**
 * Authenticated admin layout — gates every CRUD page client-side against
 * sessionStorage. Unauthenticated visitors redirect to /admin/login.
 *
 * The gate is deliberately demo-grade (sessionStorage, no server token).
 * `middleware.ts` adds `X-Robots-Tag: noindex` so crawlers ignore the
 * entire /admin tree.
 */
export default function AdminAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  // The gate must check sessionStorage post-mount (server can't see it),
  // then either redirect or mark the page ready to render. Calling setReady
  // inside the effect IS the synchronization point with the browser-only
  // session — the lint exception is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!ready) {
    return (
      <div className="bg-ink-05 grid min-h-screen place-items-center">
        <p className="body-sm text-ink-60">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="bg-ink-05 flex min-h-screen">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminMobileBar />
        <main>{children}</main>
      </div>
    </div>
  );
}
