import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComparisonRow {
  feature: string;
  standard: boolean | string;
  corporate: boolean | string;
}

/**
 * Standard vs Corporate comparison table per 08_corporate.md §7.
 * Mobile: horizontally scrollable wrapper keeps the columns intact.
 */
export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr className="border-border border-b text-left">
            <th className="text-ink-50 py-3 pr-4 overline">Feature</th>
            <th className="text-ink-50 px-4 py-3 text-center overline">Standard</th>
            <th className="text-ink-100 px-4 py-3 text-center overline">Corporate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-border border-b last:border-b-0">
              <th scope="row" className="body-md text-ink-80 py-3 pr-4 text-left font-normal">
                {row.feature}
              </th>
              <td className="px-4 py-3 text-center">
                <Cell value={row.standard} />
              </td>
              <td className="bg-signal-blue-bg px-4 py-3 text-center">
                <Cell value={row.corporate} highlight />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ value, highlight }: { value: boolean | string; highlight?: boolean }) {
  if (typeof value === "string") {
    return (
      <span className={cn("body-sm", highlight ? "text-ink-80" : "text-ink-60")}>{value}</span>
    );
  }
  return value ? (
    <Check
      aria-label="Included"
      className={cn("inline size-5", highlight ? "text-ink-100" : "text-success")}
    />
  ) : (
    <Minus aria-label="Not included" className="text-ink-50 inline size-5" />
  );
}
