"use client";

import Image from "next/image";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamCardProps {
  name: string;
  role: string;
  photo: string;
  bio: string;
  quote?: string;
  highlights?: string[];
  flipped: boolean;
  onToggle: () => void;
  className?: string;
}

export function TeamCard({
  name,
  role,
  photo,
  bio,
  quote,
  highlights,
  flipped,
  onToggle,
  className,
}: TeamCardProps) {
  return (
    <article className={cn("group relative h-full", className)}>
      <button
        type="button"
        className="focus-visible:ring-ink-100 focus-visible:ring-offset-paper relative block h-full w-full rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={onToggle}
        aria-expanded={flipped}
        aria-label={`${flipped ? "Hide" : "Show"} profile details for ${name}`}
      >
        <div
          className={cn(
            "grid h-full rounded-xl transition-transform duration-500 motion-reduce:transition-none",
            flipped
              ? "motion-safe:[transform:rotateY(180deg)]"
              : "motion-safe:[transform:rotateY(0deg)]",
          )}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="bg-paper border-border relative rounded-xl border p-4 pb-16 [grid-area:1/1]"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="bg-ink-10 relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={photo}
                alt={name}
                fill
                sizes="(min-width: 1024px) 320px, 50vw"
                className="object-cover"
              />
            </div>
            <div className="mt-4">
              <div className="headline-sm text-ink-100">{name}</div>
              <div className="label-md text-ink-60 mt-1">{role}</div>
              {quote ? (
                <blockquote className="body-sm text-ink-80 border-ink-100 mt-3 border-l-2 pl-3 italic">
                  &ldquo;{quote}&rdquo;
                </blockquote>
              ) : null}
            </div>
            <span
              aria-hidden="true"
              className="border-border bg-paper text-ink-100 absolute right-4 bottom-4 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-[var(--shadow-elevation-1)] transition-transform duration-200 group-hover:rotate-45"
            >
              <RotateCw className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </div>
          <div
            className="bg-paper border-border relative rounded-xl border p-4 pb-16 [grid-area:1/1]"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="flex h-full flex-col justify-center">
              <div>
                <div className="headline-sm text-ink-100">{name}</div>
                <div className="label-md text-ink-60 mt-1">{role}</div>
              </div>
              <p className="body-sm text-ink-80 mt-4 leading-relaxed">{bio}</p>
              {highlights && highlights.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${name} highlights`}>
                  {highlights.map((item) => (
                    <li
                      key={item}
                      className="label-sm text-ink-100 bg-ink-10 rounded-full px-3 py-1"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <span
              aria-hidden="true"
              className="border-border bg-paper text-ink-100 absolute right-4 bottom-4 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-[var(--shadow-elevation-1)] transition-transform duration-200 group-hover:rotate-45"
            >
              <RotateCw className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
