"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DestinationTile — landingpage.md §5 "Explore Lebanon".
 *
 * Image-led tile with a bottom-anchored content scrim. Full-bleed photograph
 * inside a `card-image` (ink-95) surface, rounded.xl, 4:5 aspect.
 *
 * Scrim: vertical gradient rgba(0,0,0,0) → rgba(0,0,0,0.72), 50% height.
 * Content sits inside the scrim with 24px padding.
 */

export interface DestinationTileProps {
  title: string;
  meta: string;
  image: { src: string; alt: string; width: number; height: number };
  href: string;
  className?: string;
}

export function DestinationTile({ title, meta, image, href, className }: DestinationTileProps) {
  return (
    <Link
      href={href}
      aria-label={`Plan a drive to ${title}`}
      className={cn(
        "group relative block overflow-hidden",
        "bg-ink-95 rounded-xl",
        "aspect-[3/4] w-full",
        "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />

      {/* Bottom-anchored scrim */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/72 via-black/30 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6">
        <h3 className="headline-md text-paper leading-tight">{title}</h3>
        <p className="label-md text-ink-30">{meta}</p>
        <span className="button-md text-paper mt-3 inline-flex items-center gap-1.5 underline-offset-4 group-hover:underline">
          Plan this drive
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
