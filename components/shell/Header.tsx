"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { AuthCluster } from "./AuthCluster";
import { whatsAppHref } from "@/lib/whatsapp";

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

const NAV_LINKS = [
  { href: "/long-term", label: "Long-term" },
  { href: "/chauffeur", label: "Chauffeur" },
  { href: "/corporate", label: "Corporate" },
  { href: "/locations", label: "Locations" },
  { href: "/about", label: "About" },
] as const;

type HeaderVariant = "default" | "overlay" | "inverse" | "flush" | "flush-tint";

export interface HeaderProps {
  variant?: HeaderVariant;
}

export function Header({ variant = "default" }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);

  // On the home page the hero is a full-bleed cinematic photo with a dark
  // overlay (Revision 2). The header rides on top of that photo as
  // `overlay` — transparent before scroll, solid paper once past 60px so
  // the rest of the page reads normally.
  const resolvedVariant: HeaderVariant =
    variant === "default" && pathname === "/" ? "overlay" : variant;

  React.useEffect(() => {
    if (resolvedVariant !== "overlay") return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [resolvedVariant]);

  const transparent = resolvedVariant === "overlay" && !scrolled;
  const inverse = resolvedVariant === "inverse";
  const flush = resolvedVariant === "flush";
  const flushTint = resolvedVariant === "flush-tint";
  // Header treats `overlay-before-scroll` and `inverse` the same visually
  // (paper text on a dark/transparent background).
  const onDark = transparent || inverse;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full transition-colors duration-200",
        transparent
          ? "bg-transparent"
          : inverse
            ? "bg-ink-100 text-paper"
            : flushTint
              ? "bg-ink-10"
              : flush
                ? "bg-paper"
                : "bg-paper border-border border-b",
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
          aria-label="Wheels Rent A Car home"
          className={cn(
            "absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0",
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

        {/* RIGHT cluster on lg: primary nav, then phone/WhatsApp, then auth. */}
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
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <span
            aria-hidden="true"
            className={cn("h-5 w-px", onDark ? "bg-white/15" : "bg-ink-20")}
          />
          {/* WhatsApp pill — branded green stays locked, but the affordance
           * now reads as a button (icon + "WhatsApp" label) instead of a
           * floating green disc. Collapses to icon-only on narrow lg. */}
          <a
            href={whatsAppHref("default")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className={cn(
              "label-md text-paper rounded-pill inline-flex h-9 items-center gap-2 bg-[#25D366] px-3 hover:bg-[#1eb256] active:bg-[#1ca94f]",
              "transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1eb256]",
            )}
          >
            <WhatsAppIcon className="size-4" />
            <span className="hidden xl:inline">WhatsApp</span>
          </a>
          <AuthCluster transparent={onDark} />
        </div>

        {/* Mobile cluster — far right. */}
        <div className="flex flex-1 items-center justify-end gap-2 lg:hidden">
          <a
            href={whatsAppHref("default")}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="text-paper inline-flex size-9 items-center justify-center rounded-full bg-[#25D366] active:bg-[#1ca94f]"
          >
            <WhatsAppIcon className="size-4" />
          </a>
          <Link
            href="/login"
            aria-label="Sign in"
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
      <SheetContent side="left">
        <div className="flex flex-col gap-2 pt-4">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="button-md bg-ink-100 text-paper rounded-pill flex h-12 items-center justify-center px-7"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="button-md border-ink-100 text-ink-100 rounded-pill flex h-12 items-center justify-center border-[1.5px] px-7"
          >
            Create account
          </Link>
          <div className="bg-divider my-2 h-px" />
          <nav aria-label="Primary mobile" className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="headline-xs text-ink-95 py-3.5"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/manage-booking"
              onClick={() => setOpen(false)}
              className="headline-xs text-ink-95 py-3.5"
            >
              Manage booking
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="headline-xs text-ink-95 py-3.5"
            >
              Contact
            </Link>
          </nav>
          <div className="bg-divider my-2 h-px" />
          <a
            href="tel:+9611629100"
            className="bg-ink-10 headline-xs text-ink-95 rounded-pill inline-flex items-center gap-2 px-4 py-3"
          >
            <Phone className="size-4" aria-hidden="true" /> Call +961 1 629 100
          </a>
          <a
            href={whatsAppHref("default")}
            target="_blank"
            rel="noopener noreferrer"
            className="headline-xs text-paper rounded-pill inline-flex items-center gap-2 bg-[#25D366] px-4 py-3"
          >
            <WhatsAppIcon className="size-4" /> WhatsApp
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.07 4.93A10.05 10.05 0 0 0 12 2a10 10 0 0 0-8.59 15.07L2 22l5.07-1.33A10 10 0 1 0 19.07 4.93Zm-7.06 15.4a8.31 8.31 0 0 1-4.24-1.16l-.3-.18-3 .8.8-2.93-.2-.31a8.34 8.34 0 1 1 6.95 3.78Zm4.57-6.24c-.25-.13-1.47-.73-1.7-.81s-.4-.13-.56.13-.65.81-.79.97-.29.2-.54.07a6.81 6.81 0 0 1-2-1.24 7.57 7.57 0 0 1-1.4-1.74c-.14-.25 0-.38.11-.51s.25-.29.37-.43a1.66 1.66 0 0 0 .25-.42.46.46 0 0 0 0-.44c-.06-.13-.56-1.35-.76-1.85s-.4-.42-.56-.43h-.48a.92.92 0 0 0-.67.31 2.78 2.78 0 0 0-.87 2.08c0 1.23.9 2.41 1 2.58s1.74 2.65 4.21 3.72a13.42 13.42 0 0 0 1.4.52 3.36 3.36 0 0 0 1.55.1 2.55 2.55 0 0 0 1.67-1.18 2.07 2.07 0 0 0 .14-1.18c-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}
