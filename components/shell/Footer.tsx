"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, MessageCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { whatsAppHref } from "@/lib/whatsapp";

/**
 * Global footer per 00_global.md §5 + DESIGN.md.
 *
 * Amplemarket-style 5-column row: the Wheels logo sits in the first column
 * (compact, not Rivian-massive) and the four link columns sit BESIDE it on
 * lg+, not stacked underneath. Bottom strip: copyright left, legal links +
 * social icons right. Dark gradient surface; paper text; logo inverted to
 * render in paper-on-ink.
 *
 * Language switcher (the old EN · AR · FR coming-soon strip) was removed —
 * Phase 1 is English-only and the placeholder labels were just visual noise.
 */

const WHEELS_LINKS = [
  { href: "/about", label: "About" },
  { href: "/locations", label: "Locations" },
  { href: "/vehicles", label: "Fleet" },
  { href: "/long-term", label: "Long-term rental" },
  { href: "/chauffeur", label: "Chauffeur service" },
  { href: "/corporate", label: "Corporate" },
] as const;

const HELP_LINKS = [
  { href: "/manage-booking", label: "Manage booking" },
  { href: "/help", label: "Help centre" },
  { href: "/help/faq", label: "FAQ" },
  { href: "/help/rental-terms", label: "Rental terms" },
  { href: "/help/insurance-and-coverage", label: "Insurance & coverage" },
  { href: "/help/payment-and-deposits", label: "Payment & deposits" },
  { href: "/help/cancellation-policy", label: "Cancellation policy" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="text-paper"
      style={{ backgroundImage: "var(--gradient-card-dark)" }}
    >
      <div
        className={cn(
          "mx-auto px-5 pt-16 pb-12 sm:px-10 sm:pt-20 lg:pt-24",
          "max-w-[var(--container-default)]",
        )}
      >
        <div
          className={cn(
            // Mobile: logo on its own row, then a 3-col grid of link columns.
            // lg: 4 columns in a single row — logo column + 3 link columns
            // (Wheels / Help / Contact). Trust column removed.
            "grid gap-10 sm:grid-cols-3 sm:gap-12",
            "lg:grid-cols-[auto_1fr_1fr_1fr] lg:gap-16",
          )}
        >
          {/* Logo column — compact and sits at the start of the row, not
           * spanning the full width. Sentence-case columns sit alongside on
           * lg+. */}
          <Link
            href="/"
            aria-label="Wheels Rent A Car"
            className="focus-visible:outline-paper col-span-full inline-block self-start sm:col-span-3 lg:col-span-1"
          >
            <Image
              src="/images/Logo/Logo.png"
              alt="Wheels Rent A Car"
              width={566}
              height={210}
              className="h-12 w-auto brightness-0 invert sm:h-14"
            />
          </Link>

          <FooterColumn title="Wheels">
            {WHEELS_LINKS.map((l) => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Help">
            {HELP_LINKS.map((l) => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Contact">
            <a
              href="tel:+9611629100"
              className="body-sm text-paper/85 hover:text-paper inline-flex items-center gap-2"
            >
              <Phone className="size-4" aria-hidden="true" />
              +961 1 629 100
            </a>
            <a
              href={whatsAppHref("default")}
              target="_blank"
              rel="noopener noreferrer"
              className="body-sm text-paper/85 hover:text-paper inline-flex items-center gap-2"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </a>
            <a
              href="mailto:hello@wheelsrentacar.com.lb"
              className="body-sm text-paper/85 hover:text-paper inline-flex items-center gap-2"
            >
              <Mail className="size-4" aria-hidden="true" />
              hello@wheelsrentacar.com.lb
            </a>
            <FooterLink href="/contact">All channels</FooterLink>
          </FooterColumn>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div
          className={cn(
            "mx-auto flex flex-col-reverse items-start justify-between gap-4 px-5 py-5 sm:px-10",
            "max-w-[var(--container-default)] sm:flex-row sm:items-center",
            "label-md text-paper/60",
          )}
        >
          <span>© {year} Wheels Rent A Car</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-paper">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-paper">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-paper">
              Cookies
            </Link>
            <div className="flex items-center gap-2">
              <SocialIcon href="https://instagram.com/" label="Instagram">
                <InstagramGlyph />
              </SocialIcon>
              <SocialIcon href="https://facebook.com/" label="Facebook">
                <FacebookGlyph />
              </SocialIcon>
              <SocialIcon href="https://linkedin.com/" label="LinkedIn">
                <LinkedInGlyph />
              </SocialIcon>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Sentence-case heading + heavier weight + paper at full opacity —
       * matches the Amplemarket-style reference. The old uppercase overline
       * heading read as a small system label; this reads as a proper section
       * title sitting at the top of each column. */}
      <h2 className="headline-sm text-paper">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="body-sm text-paper/85 hover:text-paper">
      {children}
    </Link>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-paper inline-flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
    >
      {children}
    </a>
  );
}

function InstagramGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.3-1.5 1.6-1.5H17V4.2c-.3 0-1.3-.2-2.5-.2-2.5 0-4 1.5-4 4.2v2.3H8v3h2.5V21h3Z" />
    </svg>
  );
}

function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.22 8h4.55v14H.22V8Zm7.5 0h4.36v1.9h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 7v7.46h-4.55v-6.62c0-1.58-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49v6.73H7.72V8Z" />
    </svg>
  );
}

