"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", labelKey: "dashboard" },
  { href: "/account/bookings", labelKey: "myBookings" },
  { href: "/account/profile", labelKey: "profile" },
  { href: "/account/documents", labelKey: "documents" },
  { href: "/account/saved-vehicles", labelKey: "savedCars" },
] as const;

/**
 * AccountNav — left sidebar nav for `/account/*` per Phase 10.
 *
 * Uppercase label-md links; active route renders as a pill-rounded
 * ink-100 chip with paper text. Mobile collapses to a horizontal scroll.
 */
export function AccountNav() {
  const t = useTranslations("account");
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Account"
      className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      {NAV.map((item) => {
        // "/account" only matches exactly; nested routes light their own item.
        const active =
          item.href === "/account"
            ? pathname === "/account"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "label-md rounded-pill px-4 py-2.5 whitespace-nowrap transition-colors duration-150",
              "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
              active ? "bg-ink-100 text-paper" : "text-ink-60 hover:bg-ink-10 hover:text-ink-100",
            )}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
