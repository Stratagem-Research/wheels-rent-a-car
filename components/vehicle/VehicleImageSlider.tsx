"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { VehicleImage } from "@/types/domain";

/**
 * Prev/next photo slider for fleet cards. Controls sit outside any parent
 * <Link> so they don't select the vehicle.
 */
export function VehicleImageSlider({
  images,
  dark = true,
  sizes,
  priority = false,
  className,
}: {
  images: VehicleImage[];
  dark?: boolean;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const t = useTranslations("fleet");
  const [index, setIndex] = React.useState(0);
  const count = images.length;
  const canSlide = count > 1;
  const current = images[index];

  const go = (delta: number) => {
    if (!canSlide) return;
    setIndex((i) => (i + delta + count) % count);
  };

  const track = (
    <div
      className="flex h-full transition-transform duration-300 ease-out"
      style={{ transform: `translateX(-${index * 100}%)` }}
    >
      {images.map((image, i) => (
        <div key={`${image.url}-${i}`} className="relative h-full min-w-full shrink-0">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes={sizes}
            priority={priority && i === 0}
            className="object-contain"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("relative my-2 w-full", className)}>
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {count === 0 ? null : (
          <div className="absolute inset-0 overflow-hidden">{track}</div>
        )}
      </div>

      {canSlide ? (
        <>
          <NavButton
            dark={dark}
            side="prev"
            label={t("prevImage")}
            onClick={() => go(-1)}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          </NavButton>
          <NavButton
            dark={dark}
            side="next"
            label={t("nextImage")}
            onClick={() => go(1)}
          >
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </NavButton>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1"
            aria-hidden="true"
          >
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-pill transition-all duration-200",
                  i === index ? "w-4" : "w-1",
                  dark
                    ? i === index
                      ? "bg-paper"
                      : "bg-paper/35"
                    : i === index
                      ? "bg-ink-100"
                      : "bg-ink-30",
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      {current ? (
        <span className="sr-only">
          {current.alt} ({index + 1}/{count})
        </span>
      ) : null}
    </div>
  );
}

function NavButton({
  dark,
  side,
  label,
  onClick,
  children,
}: {
  dark: boolean;
  side: "prev" | "next";
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full",
        "transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        side === "prev" ? "start-1.5" : "end-1.5",
        dark
          ? cn(
              "bg-paper/90 text-ink-100 shadow-[0_1px_6px_rgba(0,0,0,0.28)]",
              "hover:bg-paper",
              "focus-visible:outline-paper",
            )
          : cn(
              "bg-ink-100/80 text-paper shadow-[0_1px_4px_rgba(0,0,0,0.12)]",
              "hover:bg-ink-100",
              "focus-visible:outline-ink-100",
            ),
      )}
    >
      {children}
    </button>
  );
}
