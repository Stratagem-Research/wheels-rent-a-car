"use client";

import * as React from "react";

/**
 * AdminFormShell — wraps an edit/create form with the standard 1-column
 * paper card the admin uses everywhere. Renders an optional helper line
 * below the title and the children form fields inside.
 */
export interface AdminFormShellProps {
  title: string;
  /** Optional italic “or similar” style lead (matches public vehicle cards). */
  titleAside?: string;
  helper?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AdminFormShell({ title, titleAside, helper, children, footer }: AdminFormShellProps) {
  return (
    <div className="bg-paper border-border flex flex-col gap-4 rounded-xl border p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="headline-md text-ink-100 flex flex-wrap items-baseline gap-x-2">
          <span>{title}</span>
          {titleAside ? <span className="body-sm text-ink-50 italic font-normal">{titleAside}</span> : null}
        </h2>
        {helper ? <p className="body-sm text-ink-60">{helper}</p> : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
      {footer ? (
        <div className="border-border mt-2 flex justify-end gap-2 border-t pt-4">{footer}</div>
      ) : null}
    </div>
  );
}
