"use client";

import { FileUpload } from "@/components/ui/FileUpload";
import { Field } from "@/components/ui/FormAtoms";
import { DocumentScanPreview } from "@/components/account/DocumentScanPreview";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";
const MAX = 5 * 1024 * 1024;

export function LicenceScanFields({
  frontFile,
  backFile,
  frontUrl,
  backUrl,
  onFrontChange,
  onBackChange,
  frontError,
  backError,
  frontLabel,
  backLabel,
  helper,
}: {
  frontFile: File | null;
  backFile: File | null;
  frontUrl?: string;
  backUrl?: string;
  onFrontChange: (file: File | null) => void;
  onBackChange: (file: File | null) => void;
  frontError?: string;
  backError?: string;
  frontLabel: string;
  backLabel: string;
  helper: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={frontLabel} required error={frontError}>
        {({ id, invalid }) => (
          <div className="flex flex-col gap-2">
            {frontUrl && !frontFile ? (
              <DocumentScanPreview scanUrl={frontUrl} alt={frontLabel} size="md" />
            ) : null}
            <FileUpload
              id={id}
              label={frontLabel}
              accept={ACCEPT}
              maxSizeBytes={MAX}
              files={frontFile ? [frontFile] : []}
              onFilesChange={(files) => onFrontChange(files[0] ?? null)}
              onFileRemove={() => onFrontChange(null)}
              helper={helper}
              invalid={invalid}
            />
          </div>
        )}
      </Field>
      <Field label={backLabel} required error={backError}>
        {({ id, invalid }) => (
          <div className="flex flex-col gap-2">
            {backUrl && !backFile ? (
              <DocumentScanPreview scanUrl={backUrl} alt={backLabel} size="md" />
            ) : null}
            <FileUpload
              id={id}
              label={backLabel}
              accept={ACCEPT}
              maxSizeBytes={MAX}
              files={backFile ? [backFile] : []}
              onFilesChange={(files) => onBackChange(files[0] ?? null)}
              onFileRemove={() => onBackChange(null)}
              helper={helper}
              invalid={invalid}
            />
          </div>
        )}
      </Field>
    </div>
  );
}
