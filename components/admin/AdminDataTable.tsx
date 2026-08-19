"use client";

import * as React from "react";

/**
 * AdminDataTable — minimal table primitive for admin list views.
 *
 * Renders a paper card with a 1px border (no shadow per the brand rule).
 * Columns are typed against the row type. Actions slot on the right per
 * row for Edit / Delete / Duplicate.
 */

export interface AdminDataTableColumn<T> {
  header: string;
  /** Cell render fn — receives the row. */
  cell: (row: T) => React.ReactNode;
  /** Optional CSS width (e.g., "10rem" or "30%"). Non-percentage values also set min-width. */
  width?: string;
  className?: string;
}

export interface AdminDataTableProps<T> {
  rows: T[];
  columns: AdminDataTableColumn<T>[];
  /** Stable key extractor. */
  rowKey: (row: T) => string;
  /** Optional action cluster shown in the rightmost column. */
  rowActions?: (row: T) => React.ReactNode;
  /** Renders when `rows.length === 0`. */
  emptyState?: React.ReactNode;
}

function columnSize(width?: string): React.CSSProperties | undefined {
  if (!width) return undefined;
  if (width.endsWith("%")) return { width };
  return { width, minWidth: width };
}

export function AdminDataTable<T>({
  rows,
  columns,
  rowKey,
  rowActions,
  emptyState,
}: AdminDataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return (
      <div className="bg-paper border-border flex flex-col items-center gap-2 rounded-xl border p-12 text-center">
        {emptyState}
      </div>
    );
  }
  return (
    <div className="bg-paper border-border overflow-auto rounded-xl border">
      <table className="w-max min-w-full border-collapse">
        <thead className="bg-ink-10 border-border border-b">
          <tr>
            {columns.map((c) => (
              <th
                key={c.header}
                style={columnSize(c.width)}
                className="label-md text-ink-60 border-border px-4 py-3 text-left font-medium tracking-wider uppercase not-last:border-r"
              >
                {c.header}
              </th>
            ))}
            {rowActions ? (
              <th className="label-md text-ink-60 w-px min-w-36 px-4 py-3 text-right font-medium tracking-wider uppercase">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-ink-05 transition-colors">
              {columns.map((c, ci) => (
                <td
                  key={ci}
                  style={columnSize(c.width)}
                  className={`body-sm text-ink-90 border-border px-4 py-3 not-last:border-r ${c.className ?? ""}`}
                >
                  {c.cell(row)}
                </td>
              ))}
              {rowActions ? (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">{rowActions(row)}</div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
