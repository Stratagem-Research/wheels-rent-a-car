"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/**
 * Tripadvisor-style inverse marketing block (landingpage.md §1.2 + §6).
 *
 * Black (ink-100) surface with paper text, 60/40 split: copy left, image right.
 * The CTA is a WHITE pill (`button-primary-inverse`) — NEVER red. Red is
 * reserved for the search bar's SHOW CARS on the same page.
 *
 * Sizes:
 *   default  64px desktop padding, display-lg headline.
 *   large    96px desktop padding, display-xl headline, xl-sized CTA pill.
 *            Used in the Long-Term promo (§6).
 */

export interface InversePromoBlockProps {
  eyebrow?: string;
  headline: React.ReactNode;
  body?: React.ReactNode;
  ctaLabel: string;
  ctaHref: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  size?: "default" | "large";
  className?: string;
}

export function InversePromoBlock({
  eyebrow,
  headline,
  body,
  ctaLabel,
  ctaHref,
  image,
  size = "default",
  className,
}: InversePromoBlockProps) {
  const large = size === "large";
  return (
    <div
      className={cn(
        "bg-ink-100 text-paper rounded-xl",
        large ? "p-8 sm:p-16 lg:p-20" : "p-8 sm:p-12 lg:p-16",
        className,
      )}
    >
      <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-12">
        <div className="flex flex-col gap-5">
          {eyebrow ? <p className="text-ink-40 overline">{eyebrow}</p> : null}
          <h2
            className={cn(
              "text-paper",
              large ? "display-xl" : "display-lg",
              large ? "leading-[0.96]" : "leading-[0.98]",
            )}
          >
            {headline}
          </h2>
          {body ? (
            <p className={cn("text-ink-30 max-w-md", large ? "lead-lg" : "lead-md")}>{body}</p>
          ) : null}
          <div className="mt-2">
            <Button asChild variant="primary-inverse" size={large ? "xl" : "lg"}>
              <Link href={ctaHref}>
                {ctaLabel} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "bg-ink-90 relative overflow-hidden rounded-xl",
            large ? "aspect-[4/5]" : "aspect-[4/3]",
          )}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
