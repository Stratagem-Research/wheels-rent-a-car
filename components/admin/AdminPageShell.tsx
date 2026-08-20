"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * AdminPageShell — common top section for every admin page.
 *
 * Renders the eyebrow, title, optional description, optional back link,
 * and an `actions` slot for the New/Save/Reset buttons. The body content
 * is whatever children you pass in.
 */
export interface AdminPageShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** "/admin" or any internal route — renders an ← Back link above the title. */
  backHref?: string;
  backLabel?: string;
  /** Right-side actions (e.g., "New trip", "Save", "Reset to defaults"). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminPageShell({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-(--container-default) px-4 pb-8 pt-4 sm:px-6 lg:pb-12">
      {backHref ? (
        <Button asChild variant="tertiary" size="sm" className="-ml-3">
          <Link href={backHref} className="inline-flex items-center gap-1.5">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>
      ) : null}
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          {eyebrow ? <p className="text-ink-60 overline">{eyebrow}</p> : null}
          <h1 className="display-md text-3xl text-ink-100 text-[clamp(22px,4vw,38px)] leading-[1.05]">
            {title}
          </h1>
          {description ? <p className="lead-sm text-ink-60 max-w-xl">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
