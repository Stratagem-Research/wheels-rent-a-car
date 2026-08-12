"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";
import { cn } from "@/lib/utils";

type UploadKind = "vehicle" | "team";

export type AdminImageUploadResult = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  path?: string;
};

type StoredImage = {
  url: string;
  path: string;
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

let vehicleLibraryPromise: Promise<StoredImage[]> | null = null;

function loadVehicleLibrary(force = false): Promise<StoredImage[]> {
  if (force) vehicleLibraryPromise = null;
  if (!vehicleLibraryPromise) {
    vehicleLibraryPromise = fetch("/api/admin/media?kind=vehicle", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(data.message ?? "Failed to load image library.");
        }
        const data = (await res.json()) as { items?: StoredImage[] };
        return Array.isArray(data.items) ? data.items : [];
      })
      .catch((err) => {
        vehicleLibraryPromise = null;
        throw err;
      });
  }
  return vehicleLibraryPromise;
}

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
  const [library, setLibrary] = React.useState<StoredImage[]>([]);
  const [libraryLoading, setLibraryLoading] = React.useState(kind === "vehicle");
  const [libraryOpen, setLibraryOpen] = React.useState(false);

  const refreshLibrary = React.useCallback(async (force = false) => {
    if (kind !== "vehicle") return;
    setLibraryLoading(true);
    try {
      const items = await loadVehicleLibrary(force);
      setLibrary(items);
    } catch {
      setLibrary([]);
    } finally {
      setLibraryLoading(false);
    }
  }, [kind]);

  React.useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

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
      if (kind === "vehicle") void refreshLibrary(true);
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

  function selectFromLibrary(item: StoredImage) {
    onUploaded({
      url: item.url,
      path: item.path,
      alt: "Vehicle",
      width: 1600,
      height: 900,
    });
  }

  function renderStorageLibraryToggle() {
    if (kind !== "vehicle") return null;
    if (libraryLoading) {
      return <p className="body-xs text-ink-60">Loading uploaded images…</p>;
    }
    if (library.length === 0) {
      return <p className="body-xs text-ink-60">No uploaded images in storage yet</p>;
    }
    return (
      <Button
        type="button"
        variant="tertiary"
        size="sm"
        className="self-start"
        onClick={() => setLibraryOpen((open) => !open)}
      >
        {libraryOpen ? "Hide" : "Browse"} storage images ({library.length})
      </Button>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <div className="flex flex-wrap items-start gap-3">
        {currentUrl ? (
          <div className="border-border relative size-36 shrink-0 overflow-hidden rounded-lg border bg-ink-5">
            <Image
              src={currentUrl}
              alt=""
              fill
              sizes="144px"
              className="object-contain"
              unoptimized={currentUrl.startsWith("http")}
            />
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
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
            className="self-start"
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
          {renderStorageLibraryToggle()}
          {currentUrl && onRemoved ? (
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="self-start"
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

      {kind === "vehicle" && libraryOpen && library.length > 0 ? (
        <div className="border-border grid min-h-52 w-full max-h-96 grid-cols-3 gap-3 overflow-y-auto rounded-lg border p-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {library.map((item) => (
            <button
              key={item.url}
              type="button"
              disabled={busy}
              aria-label="Use this image"
              aria-pressed={currentUrl === item.url}
              className={cn(
                "relative aspect-square min-h-24 overflow-hidden rounded-md border bg-ink-5 transition-colors sm:min-h-28",
                currentUrl === item.url
                  ? "border-ink-100 ring-2 ring-ink-100"
                  : "border-border hover:border-ink-40",
              )}
              onClick={() => selectFromLibrary(item)}
            >
              <Image
                src={item.url}
                alt=""
                fill
                sizes="180px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
