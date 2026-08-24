import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

/**
 * AuthCard — INK & SIGNAL paper card for auth pages (Phase 10).
 *
 * Paper surface, rounded.2xl, 48px padding desktop. Headline-lg title in
 * ink-100. Subtitle in body-md / ink-60. The footer line sits below the
 * card for the sibling link (e.g. "Already have an account?").
 */
export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, subtitle, children, footer, className }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Card
        variant="default"
        className={cn("flex flex-col gap-6 rounded-2xl", "p-6 sm:p-8 lg:p-10", className)}
      >
        <div className="flex flex-col gap-2">
          <h1 className="headline-lg text-ink-100">{title}</h1>
          {subtitle ? <p className="body-md text-ink-60">{subtitle}</p> : null}
        </div>
        {children}
      </Card>
      {footer ? <div className="body-sm text-ink-60 text-center">{footer}</div> : null}
    </div>
  );
}
