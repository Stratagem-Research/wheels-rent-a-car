"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function isImageScanUrl(url: string): boolean {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  return /\.(jpe?g|png|gif|webp|avif)$/.test(path);
}

export function DocumentScanPreview({
  scanUrl,
  alt,
  size = "md",
  className,
}: {
  scanUrl: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const t = useTranslations("accountDocuments");
  const sizeClass =
    size === "sm" ? "h-16 w-24" : size === "lg" ? "h-40 w-full max-w-sm" : "h-24 w-36";

  if (isImageScanUrl(scanUrl)) {
    return (
      // Signed Supabase URLs — plain img avoids next/image remote-pattern config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={scanUrl}
        alt={alt}
        className={cn(
          "border-border bg-ink-10 rounded-lg border object-cover",
          sizeClass,
          className,
        )}
      />
    );
  }

  return (
    <a
      href={scanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "border-border bg-ink-10 text-ink-80 hover:bg-ink-20 inline-flex items-center gap-2 rounded-lg border px-3 py-2",
        className,
      )}
    >
      <FileText className="size-4 shrink-0" aria-hidden="true" />
      <span className="label-md">{t("viewScan")}</span>
    </a>
  );
}
