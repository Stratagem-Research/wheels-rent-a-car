"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  CalendarRange,
  Car,
  CarFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Droplets,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  MapIcon,
  MapPinned,
  Megaphone,
  Package,
  PhoneCall,
  Search,
  Settings2,
  SprayCan,
  Star,
  UserCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/admin/auth";
import { confirmUnsavedChanges } from "@/hooks/useUnsavedChangesGuard";

const COLLAPSE_STORAGE_KEY = "wheels.admin.sidebarCollapsed";
const GROUP_COLLAPSE_STORAGE_KEY = "wheels.admin.sidebarCollapsedGroups";

const collapsedListeners = new Set<() => void>();
const groupListeners = new Set<() => void>();

function subscribeCollapsed(onStoreChange: () => void) {
  collapsedListeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    collapsedListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getCollapsedSnapshot() {
  return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
}

function getCollapsedServerSnapshot() {
  return false;
}

/** Persisted collapse state, shared by the sidebar and the layout (which
 *  needs it too, to size the content area's left offset to match). */
export function useAdminSidebarCollapsed() {
  const collapsed = React.useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

  const toggle = React.useCallback(() => {
    const next = window.localStorage.getItem(COLLAPSE_STORAGE_KEY) !== "1";
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
    collapsedListeners.forEach((listener) => listener());
  }, []);

  return { collapsed, toggle };
}

function subscribeGroups(onStoreChange: () => void) {
  groupListeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    groupListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getGroupsSnapshot() {
  return window.localStorage.getItem(GROUP_COLLAPSE_STORAGE_KEY) ?? "";
}

function getGroupsServerSnapshot() {
  return "";
}

function parseCollapsedGroups(raw: string): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return new Set();
  }
}

function writeCollapsedGroups(groups: Set<string>) {
  window.localStorage.setItem(GROUP_COLLAPSE_STORAGE_KEY, JSON.stringify([...groups]));
  groupListeners.forEach((listener) => listener());
}

/*
 * AdminSidebar — left-rail navigation for /admin/*.
 *
 * Ink surface, paper active pill. Group headings stay uppercase; item labels
 * stay sentence case so long names remain readable in the rail.
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
      { href: "/admin/fleet", label: "Fleet", icon: CarFront },
      { href: "/admin/locations", label: "Locations", icon: MapPinned },
      { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
      { href: "/admin/catalog", label: "Catalog", icon: Package },
      { href: "/admin/car-wash-bookings", label: "Car wash bookings", icon: Droplets },
      { href: "/admin/chauffeur-requests", label: "Chauffeur requests", icon: Car },
      { href: "/admin/long-term-quotes", label: "Long-term quotes", icon: CalendarRange },
      { href: "/admin/ops", label: "Ops", icon: Settings2 },
      { href: "/admin/leads", label: "Leads", icon: Users },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/trips", label: "Trips", icon: Compass },
      { href: "/admin/itineraries", label: "Itineraries", icon: MapIcon },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/admin/help-articles", label: "Help articles", icon: BookOpen },
      { href: "/admin/corporate", label: "Corporate", icon: Building2 },
      { href: "/admin/car-wash", label: "Car wash", icon: SprayCan },
      { href: "/admin/about", label: "About", icon: Info },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/seo", label: "SEO", icon: Search },
      { href: "/admin/contact", label: "Contact", icon: PhoneCall },
    ],
  },
];

const ALL_NAV_ITEMS: NavItem[] = [TOP_ITEM, ...NAV_GROUPS.flatMap((group) => group.items)];

/** Match the item or a nested route, not a sibling that shares a prefix
 *  (`/admin/car-wash` must not light up on `/admin/car-wash-bookings`). */
function itemIsActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemClassName(collapsed: boolean, active: boolean) {
  return cn(
    "body-sm rounded-pill flex h-9 w-full min-w-0 items-center gap-3 transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper",
    collapsed ? "justify-center px-0" : "px-3",
    active
      ? "bg-paper text-ink-100"
      : "text-paper/80 hover:bg-white/10 hover:text-paper",
  );
}

function renderNavLink(item: NavItem, pathname: string | null, collapsed: boolean) {
  const { href, label, icon: Icon } = item;
  const active = itemIsActive(pathname, href);
  return (
    <Link
      key={href}
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={itemClassName(collapsed, active)}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {collapsed ? null : <span className="min-w-0 truncate">{label}</span>}
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
  const navRef = React.useRef<HTMLElement>(null);
  const collapsedGroupsRaw = React.useSyncExternalStore(
    subscribeGroups,
    getGroupsSnapshot,
    getGroupsServerSnapshot,
  );
  const collapsedGroups = React.useMemo(
    () => parseCollapsedGroups(collapsedGroupsRaw),
    [collapsedGroupsRaw],
  );

  React.useEffect(() => {
    const activeGroup = NAV_GROUPS.find((group) =>
      group.items.some((item) => itemIsActive(pathname, item.href)),
    );
    if (!activeGroup) return;
    const current = parseCollapsedGroups(
      window.localStorage.getItem(GROUP_COLLAPSE_STORAGE_KEY) ?? "",
    );
    if (!current.has(activeGroup.heading)) return;
    current.delete(activeGroup.heading);
    writeCollapsedGroups(current);
  }, [pathname]);

  React.useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const navTop = nav.getBoundingClientRect().top;
    const itemTop = active.getBoundingClientRect().top;
    const itemBottom = itemTop + active.offsetHeight;
    const navBottom = navTop + nav.clientHeight;
    if (itemTop < navTop) {
      nav.scrollTop -= navTop - itemTop + 8;
    } else if (itemBottom > navBottom) {
      nav.scrollTop += itemBottom - navBottom + 8;
    }
  }, [pathname, collapsed, collapsedGroupsRaw]);

  const toggleGroup = (heading: string) => {
    const next = parseCollapsedGroups(
      window.localStorage.getItem(GROUP_COLLAPSE_STORAGE_KEY) ?? "",
    );
    if (next.has(heading)) next.delete(heading);
    else next.add(heading);
    writeCollapsedGroups(next);
  };

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
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-white/10",
          collapsed ? "justify-center px-2 py-3" : "px-3 py-3",
        )}
      >
        <Link
          href="/admin"
          className={cn(
            "focus-visible:outline-paper rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2",
            collapsed ? "inline-flex items-center justify-center" : "inline-flex flex-col gap-0.5 px-3 py-1",
          )}
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

      <nav
        ref={navRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain",
          "[scrollbar-width:thin] [scrollbar-color:rgb(255_255_255_/_0.35)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/30",
          collapsed ? "gap-0.5 px-2 py-3" : "gap-0.5 p-3",
        )}
      >
        {renderNavLink(TOP_ITEM, pathname, collapsed)}
        {NAV_GROUPS.map((group) => {
          const groupCollapsed = !collapsed && collapsedGroups.has(group.heading);
          return (
            <div key={group.heading} className={cn(collapsed ? "mt-1" : "mt-4")}>
              {collapsed ? (
                <div className="mx-auto my-2 h-px w-6 bg-white/15" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.heading)}
                  aria-expanded={!groupCollapsed}
                  className="label-sm text-paper/60 hover:text-paper focus-visible:outline-paper mb-1 flex h-8 w-full cursor-pointer items-center justify-between rounded-lg px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {group.heading}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-3.5 shrink-0 transition-transform duration-150",
                      groupCollapsed && "-rotate-90",
                    )}
                  />
                </button>
              )}
              {groupCollapsed ? null : (
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => renderNavLink(item, pathname, collapsed))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className={cn("shrink-0 border-t border-white/10", collapsed ? "px-2 py-3" : "p-3")}>
        <button
          type="button"
          onClick={onSignOut}
          title={collapsed ? "Sign out" : undefined}
          aria-label={collapsed ? "Sign out" : undefined}
          className={cn(itemClassName(collapsed, false), "cursor-pointer")}
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {collapsed ? null : <span className="min-w-0 truncate">Sign out</span>}
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute top-1/2 left-full z-30 flex size-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center",
          "border-ink-20 bg-paper text-ink-80 rounded-full border shadow-sm",
          "hover:bg-ink-05 hover:text-ink-100 transition-colors",
          "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
        )}
      >
        {collapsed ? (
          <ChevronRight className="size-4" aria-hidden="true" />
        ) : (
          <ChevronLeft className="size-4" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}

/** Compact mobile header — current section lives in the grouped select. */
export function AdminMobileBar() {
  const pathname = usePathname();
  const router = useRouter();
  const item = ALL_NAV_ITEMS.find((entry) => itemIsActive(pathname, entry.href));
  const activeHref = item?.href ?? "/admin";
  const onSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };

  return (
    <header className="bg-ink-100 text-paper sticky top-0 z-10 flex h-14 items-center gap-3 px-4 sm:px-5 lg:hidden">
      <Link
        href="/admin"
        className="headline-xs focus-visible:outline-paper shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Wheels
      </Link>
      <div className="relative min-w-0 flex-1">
        <select
          aria-label="Admin sections"
          value={activeHref}
          onChange={(event) => {
            if (event.target.value === activeHref) return;
            if (!confirmUnsavedChanges()) {
              // Re-select the current section so the UI stays in sync after the
              // user declines the discard prompt.
              event.target.value = activeHref;
              return;
            }
            router.push(event.target.value);
          }}
          className={cn(
            "body-sm h-10 w-full min-w-0 cursor-pointer appearance-none rounded-full bg-white/10 pr-9 pl-4",
            "text-paper truncate outline-none transition-colors hover:bg-white/15",
            "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
        >
          <option value={TOP_ITEM.href} className="text-ink-100">
            {TOP_ITEM.label}
          </option>
          {NAV_GROUPS.map((group) => (
            <optgroup key={group.heading} label={group.heading}>
              {group.items.map(({ href, label }) => (
                <option key={href} value={href} className="text-ink-100">
                  {label}
                </option>
              ))}
            </optgroup>
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
        className="text-paper/80 focus-visible:outline-paper inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    </header>
  );
}
