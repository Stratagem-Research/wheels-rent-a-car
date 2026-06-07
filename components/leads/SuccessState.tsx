"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { whatsAppHref } from "@/lib/whatsapp";

/**
 * Inline success block shown in place of a form after submission.
 * Used by all three lead forms per 06/07/08 specs.
 */
export function LeadFormSuccess({ message }: { message?: string }) {
  const t = useTranslations("leads");
  return (
    <div className="bg-success-bg text-success flex flex-col items-center gap-3 rounded-md p-6 text-center">
      <Check className="size-8" aria-hidden="true" />
      <div className="headline-sm">{message ?? t("success")}</div>
      <a
        href={whatsAppHref("default")}
        target="_blank"
        rel="noopener noreferrer"
        className="label-lg text-ink-80 underline-offset-2 hover:underline"
      >
        {t("successAddSomething")} →
      </a>
    </div>
  );
}
