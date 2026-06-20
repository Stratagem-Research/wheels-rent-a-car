"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Megaphone,
  Package,
  Route,
  Settings2,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/admin/auth";

/*
 * AdminSidebar — left-rail navigation for /admin/*.
 *
 * INK & SIGNAL tokens. Active route fills with ink-100 (paper text); hover
 * lifts to ink-10. Bottom slot houses Sign-out which calls signOut() and
 * pushes back to /admin/login.
 */

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/trips", label: "Trips", icon: MapPinned },
  { href: "/admin/itineraries", label: "Itineraries", icon: MapPinned },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/corporate", label: "Corporate", icon: Building2 },
  { href: "/admin/about", label: "About", icon: Info },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/fleet", label: "Fleet", icon: Route },
  { href: "/admin/locations", label: "Locations", icon: MapPinned },
  { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
  { href: "/admin/catalog", label: "Catalog", icon: Package },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/ops", label: "Ops", icon: Settings2 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const onSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  return (
    <aside
      className="bg-ink-100 text-paper fixed inset-y-0 left-0 z-20 hidden h-dvh w-60 flex-col lg:flex"
      aria-label="Admin navigation"
    >
      <div className="shrink-0 border-b border-white/10 px-6 py-5">
        <Link href="/admin" className="inline-flex flex-col gap-0.5">
          <span className="label-sm text-paper/60">Wheels</span>
          <span className="headline-sm text-paper">Admin</span>
        </Link>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain p-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "label-md rounded-pill inline-flex h-10 items-center gap-3 px-4 transition-colors duration-150",
                active
                  ? "bg-paper text-ink-100"
                  : "text-paper/70 hover:text-paper hover:bg-white/10",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-4">

        <button
          type="button"
          onClick={onSignOut}
          className="label-md text-paper/80 hover:text-paper rounded-pill inline-flex h-10 w-full items-center gap-3 px-4 transition-colors duration-150 hover:bg-white/10"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

/** Compact mobile header — shows the active route + sign-out icon. */
export function AdminMobileBar() {
  const pathname = usePathname();
  const router = useRouter();
  const item = NAV_ITEMS.find(
    (i) => pathname === i.href || (i.href !== "/admin" && pathname?.startsWith(i.href)),
  );
  const onSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };
  return (
    <header className="bg-ink-100 text-paper sticky top-0 z-10 flex h-14 items-center justify-between gap-4 px-5 lg:hidden">
      <Link href="/admin" className="inline-flex flex-col gap-0">
        <span className="label-sm text-paper/60 leading-tight">Wheels Admin</span>
        <span className="headline-xs text-paper leading-tight">{item?.label ?? "Dashboard"}</span>
      </Link>
      <nav aria-label="Admin sections" className="flex items-center gap-1">
        {NAV_ITEMS.filter((i) => i.href !== "/admin").map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full",
              pathname?.startsWith(href)
                ? "bg-paper text-ink-100"
                : "text-paper/70 hover:bg-white/10",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </Link>
        ))}
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          className="text-paper/80 inline-flex size-9 items-center justify-center rounded-full hover:bg-white/10"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </nav>
    </header>
  );
}
