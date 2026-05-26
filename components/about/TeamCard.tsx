import Image from "next/image";
import { cn } from "@/lib/utils";

export interface TeamCardProps {
  name: string;
  role: string;
  photo: string;
  quote?: string;
  className?: string;
}

export function TeamCard({ name, role, photo, quote, className }: TeamCardProps) {
  return (
    <article className={cn("flex flex-col gap-3", className)}>
      <div className="bg-ink-10 relative aspect-square overflow-hidden rounded-xl">
        <Image
          src={photo}
          alt={name}
          fill
          sizes="(min-width: 1024px) 320px, 50vw"
          className="object-cover"
        />
      </div>
      <div>
        <div className="headline-sm text-ink-100">{name}</div>
        <div className="label-md text-ink-60 mt-1">{role}</div>
      </div>
      {quote ? (
        <blockquote className="body-sm text-ink-80 border-ink-100 border-l-2 pl-3 italic">
          &ldquo;{quote}&rdquo;
        </blockquote>
      ) : null}
    </article>
  );
}
