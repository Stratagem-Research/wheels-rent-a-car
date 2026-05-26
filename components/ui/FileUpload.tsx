"use client";

import * as React from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  /** Accepted MIME types or extensions (forwarded to <input accept>). */
  accept?: string;
  /** Max file size in bytes; exceeding sets an inline error. */
  maxSizeBytes?: number;
  /** Allow multiple files. */
  multiple?: boolean;
  /** Required for ARIA — what is this upload for? e.g. "Driver's licence". */
  label?: string;
  /** Current files (controlled). */
  files?: File[];
  /** Called when the user selects or drops files. */
  onFilesChange?: (files: File[]) => void;
  /** Called when the user removes a single file. */
  onFileRemove?: (file: File) => void;
  /** Externally provided error (from validation). */
  error?: React.ReactNode;
  /** Helper line shown when no files selected. */
  helper?: React.ReactNode;
  id?: string;
  disabled?: boolean;
  className?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Dashed drop-zone file uploader per 00_global.md §9.
 * Used for licence / ID upload and bank-transfer proof at checkout.
 */
export function FileUpload({
  accept,
  maxSizeBytes,
  multiple = false,
  label,
  files = [],
  onFilesChange,
  onFileRemove,
  error,
  helper,
  id,
  disabled,
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const reactId = React.useId();
  const inputId = id ?? `file-${reactId}`;
  const [isDragging, setIsDragging] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const next = Array.from(incoming);
    if (maxSizeBytes) {
      const oversized = next.find((f) => f.size > maxSizeBytes);
      if (oversized) {
        setLocalError(`"${oversized.name}" is larger than ${formatBytes(maxSizeBytes)}.`);
        return;
      }
    }
    setLocalError(null);
    onFilesChange?.(multiple ? [...files, ...next] : next);
  };

  const displayedError = error ?? localError;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md p-6 text-center",
          "border-border-strong bg-surface border-[1.5px] border-dashed",
          "transition-colors duration-150 ease-out",
          "hover:border-ink-100 hover:bg-signal-blue-bg",
          isDragging && "border-ink-100 bg-signal-blue-bg",
          displayedError && "border-error bg-error-bg",
          disabled && "hover:border-border-strong hover:bg-surface cursor-not-allowed opacity-60",
        )}
      >
        <Upload className="text-ink-60 size-6" aria-hidden="true" />
        <div className="label-lg text-ink-80">{label ?? "Drag a file or browse"}</div>
        {helper ? <div className="label-sm text-ink-50">{helper}</div> : null}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label="Selected files">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="border-border bg-surface flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <FileText className="text-ink-60 size-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="label-lg text-ink-95 truncate">{file.name}</div>
                <div className="label-sm text-ink-50">{formatBytes(file.size)}</div>
              </div>
              <button
                type="button"
                onClick={() => onFileRemove?.(file)}
                aria-label={`Remove ${file.name}`}
                className={cn(
                  "text-ink-60 inline-flex size-8 items-center justify-center rounded-full",
                  "hover:bg-ink-10 hover:text-ink-80",
                  "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                )}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {displayedError ? (
        <p role="alert" className="label-sm text-error">
          {displayedError}
        </p>
      ) : null}
    </div>
  );
}
