"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminMobileBar, AdminSidebar, useAdminSidebarCollapsed } from "@/components/admin/AdminSidebar";
import { getAdminSession } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";

/**
 * Authenticated admin layout — verifies server session via /api/admin/sessions.
 * Unauthenticated visitors redirect to /admin/login.
 */
export default function AdminAuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  const { collapsed, toggle } = useAdminSidebarCollapsed();

  // Browser-only gate: check session endpoint post-mount.
  React.useEffect(() => {
    getAdminSession()
      .then((session) => {
        if (!session) {
          router.replace("/admin/login");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        router.replace("/admin/login");
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="bg-ink-05 grid min-h-screen place-items-center">
        <p className="body-sm text-ink-60">Checking session…</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-ink-05 min-h-screen transition-[padding] duration-200 ease-out",
        collapsed ? "lg:pl-18" : "lg:pl-60",
      )}
    >
      <AdminSidebar collapsed={collapsed} onToggleCollapsed={toggle} />
      <div className="min-w-0">
        <AdminMobileBar />
        <main>{children}</main>
      </div>
    </div>
  );
}
