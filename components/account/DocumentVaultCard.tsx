"use client";

import { FileText, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DocumentScanPreview } from "@/components/account/DocumentScanPreview";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { UserDocument } from "@/types/domain";

/**
 * Document vault card per 12_account.md.
 */

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
      </Card>
    );
  }

  return (
    <Card variant="default" className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-4">
        {document.type === "licence" || document.type === "id" ? (
          document.scanFrontUrl || document.scanBackUrl || document.scanUrl ? (
            <div className="flex shrink-0 gap-2">
              {document.scanFrontUrl || document.scanUrl ? (
                <DocumentScanPreview
                  scanUrl={(document.scanFrontUrl || document.scanUrl)!}
                  alt={document.type === "id" ? t("idFront") : t("licenceFront")}
                  size="sm"
                />
              ) : null}
              {document.scanBackUrl ? (
                <DocumentScanPreview
                  scanUrl={document.scanBackUrl}
                  alt={document.type === "id" ? t("idBack") : t("licenceBack")}
                  size="sm"
                />
              ) : null}
            </div>
          ) : (
            <div
              className="border-border bg-ink-10 text-ink-50 flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border"
              aria-hidden="true"
            >
              <FileText className="size-6" />
            </div>
          )
        ) : document.scanUrl ? (
          <DocumentScanPreview
            scanUrl={document.scanUrl}
            alt={t("scanAlt", { title })}
            size="sm"
            className="shrink-0"
          />
        ) : (
          <div
            className="border-border bg-ink-10 text-ink-50 flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border"
            aria-hidden="true"
          >
            <FileText className="size-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="headline-xs text-ink-95">{title}</h3>
          <p className="mono-md text-ink-60">{document.number}</p>
          <p className="body-sm text-ink-60 mt-2">
            {t("issued")} {formatDate(document.issueDate, locale)} · {t("expires")}{" "}
            {formatDate(document.expiryDate, locale)}
          </p>
        </div>
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
  return new Intl.DateTimeFormat(targetLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
