"use client";

import * as React from "react";
import Image from "next/image";
import { Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { AuthCluster } from "./AuthCluster";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

/*
 * Global header per 00_global.md §3 + DESIGN.md §components.header.
 *
 * 72px tall desktop / 64px mobile. Sticky on every page after first scroll.
 *
 * Variants:
 *   default    paper surface, ink-95 text, 1px ink-20 border-bottom.
 *   overlay    transparent over the hero, solid paper once scrolled past 60px.
 *   inverse    ink-100 surface, paper text, no border (for dark hero sections).
 *
 * Mobile: hamburger opens a full-screen drawer (Sheet from S1).
 */

/** Primary nav — core routes + service pages. Help/contact live in the footer. */
const NAV_LINKS = [
  { href: "/vehicles", labelKey: "vehicles" },
  { href: "/locations", labelKey: "locations" },
  { href: "/long-term", labelKey: "longTerm" },
  { href: "/chauffeur", labelKey: "chauffeur" },
  { href: "/corporate", labelKey: "corporate" },
  { href: "/about", labelKey: "about" },
] as const;

/** Mobile drawer — same primary nav as desktop; guest booking lookup lives in footer. */
const MOBILE_DRAWER_LINKS = NAV_LINKS;

type HeaderVariant = "default" | "overlay" | "inverse" | "flush" | "flush-tint";

export interface HeaderProps {
  variant?: HeaderVariant;
}

export function Header({ variant = "default" }: HeaderProps) {
  const tGlobal = useTranslations("global");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const [heroInView, setHeroInView] = React.useState(true);
  const [stuck, setStuck] = React.useState(false);
  const [mobileHidden, setMobileHidden] = React.useState(false);
  const lastScrollYRef = React.useRef(0);

  // On the home page the hero is a full-bleed cinematic photo with a dark
  // overlay (Revision 2). The header rides on top of that photo as
  // `overlay` — transparent before scroll, solid paper once past 60px so
  // the rest of the page reads normally.
  const resolvedVariant: HeaderVariant =
    variant === "default" && pathname === "/" ? "overlay" : variant;

  React.useEffect(() => {
    if (resolvedVariant !== "overlay") return;

    const hero = document.getElementById("home-hero");
    if (!hero) {
      // Safety fallback: if home hero context is missing, force a readable bar.
      requestAnimationFrame(() => setHeroInView(false));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setHeroInView(entry.isIntersecting);
      },
      {
        rootMargin: "-60px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [resolvedVariant]);

  React.useEffect(() => {
    const onScrollOrResize = () => {
      const y = window.scrollY;
      setStuck(y > 0);

      const isMobile = window.innerWidth < 1024;
      if (!isMobile) {
        setMobileHidden(false);
        lastScrollYRef.current = y;
        return;
      }

      const scrollingDown = y > lastScrollYRef.current;
      setMobileHidden(scrollingDown && y > 80);
      lastScrollYRef.current = y;
    };

    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  const transparent = resolvedVariant === "overlay" && heroInView;
  const inverse = resolvedVariant === "inverse";
  const flush = resolvedVariant === "flush";
  const flushTint = resolvedVariant === "flush-tint";
  const elevated = stuck && !transparent;
  // Header treats `overlay-before-scroll` and `inverse` the same visually
  // (paper text on a dark/transparent background).
  const onDark = transparent || inverse;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full transition-colors transition-transform duration-200",
        mobileHidden ? "-translate-y-full lg:translate-y-0" : "translate-y-0",
        transparent
          ? "bg-transparent"
          : inverse
            ? "bg-ink-100 text-paper"
            : flushTint
              ? "bg-ink-10"
              : flush
                ? "bg-paper"
                : "bg-paper border-border border-b",
        elevated && "shadow-[var(--shadow-elevation-1)]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-16 items-center gap-6 px-5 sm:px-10 lg:h-18",
          "max-w-[var(--container-default)]",
        )}
      >
        <div className="flex items-center gap-3 lg:hidden">
          <MobileMenu onDark={onDark} />
        </div>
        {/* Wheels logo — anchored LEFT (TravelPerk pattern). */}
        <Link
          href="/"
          aria-label={tGlobal("brand")}
          className={cn(
            "absolute -translate-x-1/2 lg:static lg:translate-x-0",
            isRtl ? "right-1/2" : "left-1/2",
            "focus-visible:outline-2 focus-visible:outline-offset-4",
            onDark ? "focus-visible:outline-paper" : "focus-visible:outline-ink-100",
          )}
        >
          <Image
            src="/images/Logo/Logo.png"
            alt="Wheels Rent A Car"
            width={566}
            height={210}
            priority
            className={cn(
              "h-9 w-auto lg:h-10",
              // The logo PNG is already on-brand. When the header sits on a dark
              // surface (inverse / overlay-pre-scroll), invert it so it reads.
              onDark && "brightness-0 invert",
            )}
          />
        </Link>

        {/* Spacer pushes nav + actions cluster to the right. */}
        <div className="hidden flex-1 lg:block" aria-hidden="true" />

        {/* RIGHT cluster on lg: primary nav + auth. Contact channels live in footer/FAB. */}
        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "headline-xs relative pb-0.5 whitespace-nowrap transition-colors duration-150",
                  "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[2px]",
                  active ? "after:bg-current" : "after:bg-transparent",
                  onDark
                    ? "text-paper hover:text-paper/80"
                    : active
                      ? "text-ink-100"
                      : "text-ink-60 hover:text-ink-100",
                )}
              >
                {tNav(link.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LocaleSwitcher
            locale={locale}
            onDark={onDark}
            onChange={(nextLocale) => router.replace(pathname || "/", { locale: nextLocale })}
          />
          <AuthCluster transparent={onDark} />
        </div>

        {/* Mobile cluster — far right. WhatsApp is on the global FAB. */}
        <div className="flex flex-1 items-center justify-end lg:hidden">
          <Link
            href="/login"
            aria-label={tGlobal("signIn")}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full",
              onDark ? "text-paper" : "text-ink-80 hover:bg-ink-10",
            )}
          >
            <User aria-hidden="true" className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ onDark }: { onDark: boolean }) {
  const tGlobal = useTranslations("global");
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
            onDark
              ? "text-paper focus-visible:outline-paper hover:bg-white/10"
              : "text-ink-80 hover:bg-ink-10 focus-visible:outline-ink-100",
          )}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side={isRtl ? "right" : "left"}>
        <div className="flex flex-col gap-2 pt-4">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="button-md bg-ink-100 text-paper rounded-pill flex h-12 items-center justify-center px-7"
          >
            {tGlobal("signIn")}
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="button-md border-ink-100 text-ink-100 rounded-pill flex h-12 items-center justify-center border-[1.5px] px-7"
          >
            {tGlobal("register")}
          </Link>
          <div className="bg-divider my-2 h-px" />
          <nav aria-label="Primary mobile" className="flex flex-col">
            {MOBILE_DRAWER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="headline-xs text-ink-95 py-3.5"
              >
                {tNav(link.labelKey)}
              </Link>
            ))}
          </nav>
          <div className="bg-divider my-2 h-px" />
          <div className="flex items-center gap-2">
            <span className="label-md text-ink-60">{tFooter("switchLanguage")}:</span>
            <LocaleSwitcher
              locale={locale}
              onChange={(nextLocale) => {
                setOpen(false);
                router.replace(pathname || "/", { locale: nextLocale });
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LocaleSwitcher({
  locale,
  onDark,
  onChange,
}: {
  locale: string;
  onDark?: boolean;
  onChange: (locale: "en" | "ar" | "fr") => void;
}) {
  const locales = [
    { id: "en", label: "EN" },
    { id: "ar", label: "AR" },
    { id: "fr", label: "FR" },
  ] as const;

  return (
    <div className="rounded-pill inline-flex items-center gap-1 border border-white/20 px-1 py-1">
      {locales.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => onChange(l.id)}
          className={cn(
            "label-sm rounded-pill px-2 py-1 transition-colors",
            locale === l.id
              ? "bg-paper text-ink-100"
              : onDark
                ? "text-paper/80 hover:text-paper hover:bg-white/20"
                : "text-ink-60 hover:bg-ink-10 hover:text-ink-100",
          )}
          aria-pressed={locale === l.id}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
