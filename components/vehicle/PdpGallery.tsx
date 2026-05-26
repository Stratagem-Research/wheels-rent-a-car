"use client";

import * as React from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehicleImage } from "@/types/domain";

/**
 * PDP gallery per 03_vehicle_detail.md §2.
 *
 * - Hero 4:3, rounded-lg. Thumbnails below, 80×80, active outlined.
 * - Hero click opens a full-screen lightbox.
 * - Lightbox keyboard nav: ← / → cycle, Esc closes (Radix Dialog handles Esc).
 * - Aspect ratio locked → no CLS on image load.
 */

export interface PdpGalleryProps {
  images: VehicleImage[];
  /** Used as the lightbox a11y title; defaults to "Vehicle gallery". */
  title?: string;
}

export function PdpGallery({ images, title = "Vehicle gallery" }: PdpGalleryProps) {
  const [active, setActive] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const safeImages = images.length > 0 ? images : [];
  const current = safeImages[active] ?? null;
  if (!current) return null;

  const move = (delta: number) => {
    setActive((i) => (i + delta + safeImages.length) % safeImages.length);
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open vehicle gallery"
        className={cn(
          "bg-ink-10 relative aspect-[4/3] w-full overflow-hidden rounded-lg",
          "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
        )}
      >
        <Image
          src={current.url}
          alt={current.alt}
          fill
          sizes="(min-width: 1024px) 720px, 100vw"
          priority
          className="object-cover"
        />
      </button>

      {safeImages.length > 1 ? (
        <ul aria-label="Gallery thumbnails" className="flex items-center gap-2">
          {safeImages.map((img, i) => (
            <li key={img.url + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${safeImages.length}`}
                aria-current={i === active ? "true" : undefined}
                className={cn(
                  "bg-ink-10 relative size-20 overflow-hidden rounded-md border-2 transition-colors",
                  i === active ? "border-ink-100" : "hover:border-border-strong border-transparent",
                  "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                )}
              >
                <Image src={img.url} alt={img.alt} fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(11,14,19,0.85)]" />
          <Dialog.Content
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") move(-1);
              if (e.key === "ArrowRight") move(1);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
          >
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            <div className="relative aspect-[4/3] w-full max-w-5xl">
              <Image
                src={current.url}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
              {safeImages.length > 1 ? (
                <>
                  <LightboxNav side="left" onClick={() => move(-1)} />
                  <LightboxNav side="right" onClick={() => move(1)} />
                </>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Close gallery"
              className={cn(
                "absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full",
                "text-paper bg-white/10 hover:bg-white/20",
                "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
              )}
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function LightboxNav({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full",
        "text-paper bg-white/10 hover:bg-white/20",
        "focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      {side === "left" ? (
        <ChevronLeft aria-hidden="true" className="size-6" />
      ) : (
        <ChevronRight aria-hidden="true" className="size-6" />
      )}
    </button>
  );
}
