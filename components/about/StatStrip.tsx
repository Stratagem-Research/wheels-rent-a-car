import { cn } from "@/lib/utils";

/**
 * 4-stat horizontal block per 09_about.md §3.
 * Numbers render in display-xl with tabular figures so they don't shift
 * on hover/transitions.
 */
export interface Stat {
  value: string;
  label: string;
}

export function StatStrip({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <section aria-label="By the numbers" className={cn("bg-ink-10", className)}>
      <ul className="mx-auto grid max-w-[var(--container-default)] grid-cols-2 gap-6 px-5 py-16 sm:px-10 sm:py-20 lg:grid-cols-4 lg:gap-8">
        {stats.map((s) => (
          <li key={s.label} className="flex flex-col items-center text-center">
            <span className="display-md text-ink-100 text-[clamp(40px,5vw,56px)] leading-[1] tabular-nums">
              {s.value}
            </span>
            <span className="label-md text-ink-60 mt-3">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
