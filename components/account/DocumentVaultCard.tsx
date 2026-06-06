"use client";

import { FileText, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DocumentStatus, UserDocument } from "@/types/domain";

/**
 * Document vault card per 12_account.md.
 */

const STATUS_BADGE: Record<
  DocumentStatus,
  { labelKey: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  pending: { labelKey: "pendingReview", variant: "pending" },
  verified: { labelKey: "verified", variant: "new" },
  expired: { labelKey: "expired", variant: "bestDeal" },
  rejected: { labelKey: "rejected", variant: "bestDeal" },
};

export interface DocumentVaultCardProps {
  title: string;
  document: UserDocument | null;
  onEdit?: () => void;
  onReplace?: () => void;
  onDelete?: () => void;
}

export function DocumentVaultCard({
  title,
  document,
  onEdit,
  onReplace,
  onDelete,
}: DocumentVaultCardProps) {
  const t = useTranslations("accountDocuments");
  const locale = useLocale();
  if (!document) {
    return (
      <Card variant="outline" className="flex flex-col items-start gap-3 p-5">
        <div>
          <h3 className="headline-xs text-ink-95">{title}</h3>
          <p className="body-sm text-ink-60">{t("noDocument")}</p>
        </div>
        <Button variant="primary" size="sm" onClick={onReplace}>
          {t("upload")} {title.toLowerCase()}
        </Button>
      </Card>
    );
  }

  const badge = STATUS_BADGE[document.status];

  return (
    <Card variant="default" className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="headline-xs text-ink-95">{title}</h3>
          <p className="mono-md text-ink-60">{document.number}</p>
        </div>
        <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
      </div>
      <div className="body-sm text-ink-60 flex items-center gap-3">
        <FileText className="size-4" aria-hidden="true" />
        <span>
          {t("issued")} {formatDate(document.issueDate, locale)} · {t("expires")}{" "}
          {formatDate(document.expiryDate, locale)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="tertiary" size="sm" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden="true" /> {t("editDetails")}
        </Button>
        <Button variant="tertiary" size="sm" onClick={onReplace}>
          {t("replace")}
        </Button>
        <Button variant="tertiary" size="sm" onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden="true" /> {t("delete")}
        </Button>
      </div>
    </Card>
  );
}

function formatDate(isoDate: string, locale: string): string {
  if (!isoDate) return "—";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  const targetLocale = locale === "ar" ? "ar-LB" : locale === "fr" ? "fr-FR" : "en-US";
  return new Intl.DateTimeFormat(targetLocale, { day: "2-digit", month: "short", year: "numeric" }).format(
    date,
  );
}
