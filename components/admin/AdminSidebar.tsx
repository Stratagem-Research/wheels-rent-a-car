"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  BookOpen,
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
  UserCircle,
  MapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/admin/auth";

const COLLAPSE_STORAGE_KEY = "wheels.admin.sidebarCollapsed";

/** Persisted collapse state, shared by the sidebar and the layout (which
 *  needs it too, to size the content area's left offset to match). */
export function useAdminSidebarCollapsed() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  // Avoid a flash of the collapsed layout before localStorage is read.
  return { collapsed: hydrated ? collapsed : false, toggle };
}

/*
 * AdminSidebar — left-rail navigation for /admin/*.
 *
 * INK & SIGNAL tokens. Active route fills with ink-100 (paper text); hover
 * lifts to ink-10. Bottom slot houses Sign-out which calls signOut() and
 * pushes back to /admin/login.
 */

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  heading: string;
  items: NavItem[];
};

const TOP_ITEM: NavItem = { href: "/admin", label: "Dashboard", icon: LayoutDashboard };

const NAV_GROUPS: NavGroup[] = [
  {
    heading: "Data",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
      { href: "/admin/users", label: "Users", icon: UserCircle },
      { href: "/admin/leads", label: "Leads", icon: Users },
      { href: "/admin/fleet", label: "Fleet", icon: Route },
      { href: "/admin/locations", label: "Locations", icon: MapPinned },
      { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
      { href: "/admin/catalog", label: "Catalog", icon: Package },
      { href: "/admin/car-wash-bookings", label: "Car wash bookings", icon: Droplets },
      { href: "/admin/chauffeur-requests", label: "Chauffeur requests", icon: Car },
      { href: "/admin/long-term-quotes", label: "Long-term quotes", icon: CalendarRange },
      { href: "/admin/ops", label: "Ops", icon: Settings2 },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/trips", label: "Trips", icon: MapPinned },
      { href: "/admin/itineraries", label: "Itineraries", icon: MapIcon },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/admin/corporate", label: "Corporate", icon: Building2 },
      { href: "/admin/car-wash", label: "Car wash", icon: Droplets },
      { href: "/admin/about", label: "About", icon: Info },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
];

const ALL_NAV_ITEMS: NavItem[] = [TOP_ITEM, ...NAV_GROUPS.flatMap((g) => g.items)];

function renderNavLink(
  { href, label, icon: Icon }: NavItem,
  pathname: string | null,
  collapsed: boolean,
) {
  const active = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
  return (
    <Link
      key={href}
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "label-md rounded-pill inline-flex h-8 items-center gap-3 transition-colors duration-150",
        collapsed ? "justify-center px-0" : "px-4",
        active
          ? "bg-paper text-ink-100"
          : "text-paper/70 hover:text-paper hover:bg-white/10",
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {collapsed ? null : label}
    </Link>
  );
}

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const onSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  return (
    <aside
      className={cn(
        "bg-ink-100 text-paper fixed inset-y-0 left-0 z-20 hidden h-dvh flex-col transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-18" : "w-60",
      )}
      aria-label="Admin navigation"
    >
      <div className="flex shrink-0 items-center border-b border-white/10 px-5 pt-5 pb-3">
        <Link
          href="/admin"
          className={cn("inline-flex flex-col gap-0.5", collapsed && "items-center")}
        >
          {collapsed ? (
            <span className="headline-sm text-paper">W</span>
          ) : (
            <>
              <span className="label-sm text-paper/60">Wheels</span>
              <span className="headline-sm text-paper">Admin</span>
            </>
          )}
        </Link>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain scrollbar-none p-3">
        {renderNavLink(TOP_ITEM, pathname, collapsed)}
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="mt-2">
            {!collapsed && (
              <span className="label-xs text-paper/40 mb-0.5 block px-4 uppercase tracking-wider">
                {group.heading}
              </span>
            )}
            <div className="flex flex-col">
              {group.items.map((item) => renderNavLink(item, pathname, collapsed))}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onSignOut}
          title={collapsed ? "Sign out" : undefined}
          aria-label={collapsed ? "Sign out" : undefined}
          className={cn(
            "label-md text-paper/80 hover:text-paper rounded-pill inline-flex h-10 w-full items-center gap-3 transition-colors duration-150 hover:bg-white/10",
            collapsed ? "justify-center px-0" : "px-4",
          )}
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {collapsed ? null : "Sign out"}
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "bg-white hover:bg-white/80 text-ink-80 hover:text-ink-80 absolute top-1/2 left-full z-30",
          "flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center",
          "rounded-full border border-white/15 shadow-sm transition-colors",
          "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
        )}
      >
        {collapsed ? (
          <ChevronRight className="size-3.5" aria-hidden="true" />
        ) : (
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}

/** Compact mobile header — shows the active route + sign-out icon. */
export function AdminMobileBar() {
  const pathname = usePathname();
  const router = useRouter();
  const item = ALL_NAV_ITEMS.find(
    (i) => pathname === i.href || (i.href !== "/admin" && pathname?.startsWith(i.href)),
  );
  const activeHref = item?.href ?? "/admin";
  const onSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  return (
    <header className="bg-ink-100 text-paper sticky top-0 z-10 flex h-14 items-center gap-3 px-4 sm:px-5 lg:hidden">
      <Link href="/admin" className="inline-flex shrink-0 flex-col gap-0">
        <span className="label-sm text-paper/60 hidden leading-tight sm:block">Wheels Admin</span>
        <span className="headline-xs text-paper leading-tight">{item?.label ?? "Dashboard"}</span>
      </Link>
      <div className="relative min-w-0 flex-1">
        <select
          aria-label="Admin sections"
          value={activeHref}
          onChange={(e) => router.push(e.target.value)}
          className={cn(
            "label-md h-9 w-full appearance-none rounded-full bg-white/10 pr-9 pl-4",
            "text-paper outline-none transition-colors hover:bg-white/15",
            "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          {ALL_NAV_ITEMS.map(({ href, label }) => (
            <option key={href} value={href} className="text-ink-100">
              {label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="text-paper/70 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        />
      </div>
      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sign out"
        className="text-paper/80 inline-flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    </header>
  );
}
