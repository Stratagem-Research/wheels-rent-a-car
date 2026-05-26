"use client";

import { FileText, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DocumentStatus, UserDocument } from "@/types/domain";

/**
 * Document vault card per 12_account.md.
 */

const STATUS_BADGE: Record<
  DocumentStatus,
  { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }
> = {
  pending: { label: "Pending review", variant: "pending" },
  verified: { label: "Verified", variant: "new" },
  expired: { label: "Expired", variant: "bestDeal" },
  rejected: { label: "Rejected", variant: "bestDeal" },
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
  if (!document) {
    return (
      <Card variant="outline" className="flex flex-col items-start gap-3 p-5">
        <div>
          <h3 className="headline-xs text-ink-95">{title}</h3>
          <p className="body-sm text-ink-60">No document on file.</p>
        </div>
        <Button variant="primary" size="sm" onClick={onReplace}>
          Upload {title.toLowerCase()}
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
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <div className="body-sm text-ink-60 flex items-center gap-3">
        <FileText className="size-4" aria-hidden="true" />
        <span>
          Issued {document.issueDate} · Expires {document.expiryDate}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="tertiary" size="sm" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden="true" /> Edit details
        </Button>
        <Button variant="tertiary" size="sm" onClick={onReplace}>
          Replace
        </Button>
        <Button variant="tertiary" size="sm" onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden="true" /> Delete
        </Button>
      </div>
    </Card>
  );
}
