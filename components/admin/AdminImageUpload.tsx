"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";

type UploadKind = "vehicle" | "team";

export type AdminImageUploadResult = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  path?: string;
};

type AdminImageUploadProps = {
  kind: UploadKind;
  entityId: string;
  label?: string;
  currentUrl?: string;
  onUploaded: (result: AdminImageUploadResult) => void;
  onRemoved?: () => void;
  className?: string;
};

export function AdminImageUpload({
  kind,
  entityId,
  label = "Upload image",
  currentUrl,
  onUploaded,
  onRemoved,
  className,
}: AdminImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", kind);
      form.set("entityId", entityId || "item");
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        headers: { ...getAdminCsrfHeader() },
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as AdminImageUploadResult & {
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message ?? "Upload failed.");
      }
      onUploaded({
        url: data.url,
        alt: data.alt,
        width: data.width ?? 1600,
        height: data.height ?? 900,
        path: data.path,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!currentUrl || !onRemoved) return;
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/admin/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAdminCsrfHeader(),
        },
        body: JSON.stringify({ kind, url: currentUrl }),
      }).catch(() => undefined);
      onRemoved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start gap-3">
        {currentUrl ? (
          <div className="border-border relative size-24 overflow-hidden rounded-lg border bg-ink-5">
            <Image
              src={currentUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized={currentUrl.startsWith("http")}
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            aria-label={label}
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            {currentUrl ? "Replace image" : label}
          </Button>
          {currentUrl && onRemoved ? (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              disabled={busy}
              onClick={() => void handleRemove()}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Remove
            </Button>
          ) : null}
          <p className="body-xs text-ink-60">JPEG, PNG, WebP, or AVIF · max 5 MB</p>
          {error ? (
            <p className="body-sm text-signal-red" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
