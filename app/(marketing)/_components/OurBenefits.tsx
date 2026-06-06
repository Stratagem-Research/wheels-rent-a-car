"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Plane,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { whatsAppHref } from "@/lib/whatsapp";

/**
 * Our Benefits — landingpage.md §3 + TravelPerk feature-row pattern.
 *
 * Horizontal snap-scroll row of generous benefit cards (~360-420px wide)
 * on a tinted band. Each card has an icon, a headline, a body, and a
 * "Learn more →" pill linking to the relevant deep route. The card
 * surfaces alternate between paper and a single dark ink-100 accent
 * (the WhatsApp card — black is the brand spine, used here in place of
 * TravelPerk's lime green) so the row has rhythm without leaning on
 * non-system colours.
 *
 * Prev / next pill buttons in the section footer scroll the row in
 * card-width steps (`scrollBy({ left: ±width })`). Touch / trackpad
 * horizontal scrolling and keyboard tab navigation still work natively.
 */

type Surface = "paper" | "ink";

const BENEFITS: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  external?: boolean;
  cta: string;
  surface: Surface;
}> = [
  {
    icon: Plane,
    title: "Free pickup at Hazmieh",
    body: "Meet our agent at the Hazmieh hub. Keys in hand, paperwork done, driving in 15 minutes — no airport queues, no surprise transfer fees.",
    href: "/locations",
    cta: "Find the hub",
    surface: "paper",
  },
  {
    icon: CalendarX,
    title: "Free cancellation up to 24h",
    body: "Plans change. Cancel free up to 24 hours before pickup and we'll refund what you paid — no fees, no rebooking dance, no fine print.",
    href: "/help/cancellation-policy",
    cta: "Read the policy",
    surface: "paper",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp 24/7",
    body: "Real humans on the other end of every message. Local-language support, instant replies in business hours, on-call overnight. No bots, no hold music.",
    href: whatsAppHref("default"),
    external: true,
    cta: "Chat with us",
    surface: "ink",
  },
  {
    icon: Wallet,
    title: "Pay how you want",
    body: "Card, cash, bank transfer, or OMT / Whish — whatever's easiest. Cash and OMT confirm in person; cards confirm instantly.",
    href: "/help/payment-and-deposits",
    cta: "See payment options",
    surface: "paper",
  },
];

export function OurBenefits() {
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLLIElement>("li");
    const step = firstCard?.offsetWidth ?? 400;
    const gap = 24;
    el.scrollBy({ left: direction * (step + gap), behavior: "smooth" });
  };

  return (
    <Reveal as="section" className="bg-ink-10">
      <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-32">
        <div className="mb-10 flex max-w-2xl flex-col gap-4 lg:mb-14">
          <p className="text-ink-60 overline">Why Wheels</p>
          <h2 className="display-md text-ink-100 text-[clamp(32px,4.5vw,56px)] leading-[1]">
            The basics, covered.
          </h2>
          <p className="lead-lg text-ink-60 mt-1 max-w-xl">
            No surprises. No fine print. Drive with the operator that picks you up at our hub and
            stays in WhatsApp range the whole trip.
          </p>
        </div>

        {/* Horizontal snap-scroll inside the section's 40px gutter — no
         * negative-margin bleed, so cards never look cropped at the page edge. */}
        <ul
          ref={scrollerRef}
          className={cn(
            "flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 sm:gap-6",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          aria-label="Why Wheels benefits"
        >
          {BENEFITS.map((b) => (
            <li
              key={b.title}
              className={cn(
                "w-[80%] shrink-0 snap-start",
                "sm:w-[360px] lg:w-[400px] xl:w-[420px]",
              )}
            >
              <BenefitCard {...b} />
            </li>
          ))}
        </ul>

        {/* Prev / next controls — TravelPerk pattern. The scroller is the
         * authoritative source, these buttons just animate-scroll it by a
         * card width. Hidden on touch viewports where horizontal swipe is
         * the natural affordance. */}
        <div className="mt-6 hidden items-center justify-end gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous benefit"
            className={cn(
              "rounded-pill border-ink-100 text-ink-100 inline-flex size-11 items-center justify-center border-[1.5px]",
              "hover:bg-ink-100 hover:text-paper transition-colors duration-150",
              "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Next benefit"
            className={cn(
              "rounded-pill border-ink-100 text-ink-100 inline-flex size-11 items-center justify-center border-[1.5px]",
              "hover:bg-ink-100 hover:text-paper transition-colors duration-150",
              "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
            )}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Reveal>
  );
}

/** Single source of truth: --gradient-card-dark in styles/tokens.css. */
const CARD_GRADIENT_DARK = "var(--gradient-card-dark)";

function BenefitCard({
  icon: Icon,
  title,
  body,
  href,
  external,
  cta,
  surface,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  external?: boolean;
  cta: string;
  surface: Surface;
}) {
  const dark = surface === "ink";

  // Whole-card link target — `<a>` for external (WhatsApp), `<Link>` for internal.
  const linkProps = external
    ? { href, target: "_blank" as const, rel: "noopener noreferrer" }
    : { href };
  const LinkEl: React.ElementType = external ? "a" : Link;

  return (
    <article
      className={cn(
        "group relative isolate flex h-full flex-col overflow-hidden rounded-xl",
        "min-h-[420px] p-8 sm:min-h-[460px] sm:p-10",
        dark ? "text-paper" : "bg-paper text-ink-100",
      )}
      style={dark ? { backgroundImage: CARD_GRADIENT_DARK } : undefined}
    >
      <div
        className={cn(
          "inline-flex size-12 items-center justify-center rounded-full",
          dark ? "bg-paper/10 text-paper" : "bg-ink-10 text-ink-100",
        )}
      >
        <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
      </div>

      <h3 className={cn("headline-lg mt-6 leading-tight", dark ? "text-paper" : "text-ink-100")}>
        {title}
      </h3>
      <p className={cn("body-md mt-3", dark ? "text-paper/70" : "text-ink-60")}>{body}</p>

      {/* Learn-more pill anchored to the bottom of the card. The whole-card
       * link sits behind it at z-0, but this pill is the visible affordance. */}
      <div className="mt-auto pt-6">
        <span
          className={cn(
            "rounded-pill button-sm relative z-[1] inline-flex h-10 items-center gap-2 border-[1.5px] px-4",
            "transition-colors duration-150",
            dark
              ? "border-paper text-paper group-hover:bg-paper group-hover:text-ink-100"
              : "border-ink-100 text-ink-100 group-hover:bg-ink-100 group-hover:text-paper",
          )}
        >
          {cta}
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>

      <LinkEl
        {...linkProps}
        aria-label={`${cta}: ${title}`}
        className={cn(
          "absolute inset-0 z-0 rounded-xl",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
          dark ? "focus-visible:outline-paper" : "focus-visible:outline-ink-100",
        )}
      />
    </article>
  );
}
