import { cn } from "@/lib/utils";

export interface ValuePropTileProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  className?: string;
}

/**
 * 4-up value-prop tile per 08_corporate.md §2.
 * Reused conceptually on home + long-term but with distinct content.
 */
export function ValuePropTile({ icon, title, body, className }: ValuePropTileProps) {
  return (
    <div className={cn("bg-surface-subtle flex flex-col gap-2 rounded-lg p-6", className)}>
      <span aria-hidden="true" className="text-ink-100">
        {icon}
      </span>
      <h3 className="headline-sm text-ink-95">{title}</h3>
      <p className="body-sm text-ink-60">{body}</p>
    </div>
  );
}
