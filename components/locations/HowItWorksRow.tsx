import { cn } from "@/lib/utils";

export interface HowItWorksStep {
  title: string;
  body: string;
  icon?: React.ReactNode;
}

/**
 * Numbered"how it works" row per 05_locations.md + 06_long_term.md.
 * Reusable across BEY pickup, long-term, chauffeur.
 */
export function HowItWorksRow({
  steps,
  className,
}: {
  steps: HowItWorksStep[];
  className?: string;
}) {
  return (
    <ol
      className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-4", className)}
      aria-label="How it works"
    >
      {steps.map((step, i) => (
        <li
          key={step.title}
          className="bg-surface border-border relative flex flex-col gap-2 rounded-lg border p-5"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-ink-100 text-paper headline-xs inline-flex size-9 items-center justify-center rounded-full"
            >
              {i + 1}
            </span>
            {step.icon ? (
              <span aria-hidden="true" className="text-ink-100">
                {step.icon}
              </span>
            ) : null}
          </div>
          <h3 className="headline-sm text-ink-95">{step.title}</h3>
          <p className="body-sm text-ink-60">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
