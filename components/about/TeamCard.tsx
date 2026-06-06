"use client";

import Image from "next/image";
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
    <article className={cn("group relative", className)}>
      <button
        type="button"
        className="focus-visible:ring-ink-100 focus-visible:ring-offset-paper relative block w-full rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={onToggle}
        aria-expanded={flipped}
        aria-label={`${flipped ? "Hide" : "Show"} profile details for ${name}`}
      >
        <div
          className={cn(
            "relative min-h-[460px] rounded-xl transition-transform duration-500 motion-reduce:transition-none",
            flipped
              ? "motion-safe:[transform:rotateY(180deg)]"
              : "motion-safe:[transform:rotateY(0deg)]",
          )}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="bg-paper border-border absolute inset-0 rounded-xl border p-4"
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
              <p className="label-sm text-ink-60 mt-4">Tap to read full profile</p>
            </div>
          </div>
          <div
            className="bg-paper border-border absolute inset-0 rounded-xl border p-4"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="flex h-full flex-col">
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
              <p className="label-sm text-ink-60 mt-auto pt-4">Tap again to close</p>
            </div>
          </div>
        </div>
      </button>
    </article>
  );
}
