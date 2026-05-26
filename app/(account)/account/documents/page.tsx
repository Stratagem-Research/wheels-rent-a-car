"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { FileUpload } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { DocumentVaultCard } from "@/components/account/DocumentVaultCard";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { DocumentType, UserDocument } from "@/types/domain";

const COUNTRIES = [
  { code: "LB", name: "Lebanon" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
];

export default function DocumentsPage() {
  const [docs, setDocs] = React.useState<UserDocument[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ items: UserDocument[] }>(endpoints.accountDocuments);
        if (!cancelled) setDocs(res.items);
      } catch {
        if (!cancelled) setDocs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (docs === null) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  const licence = docs.find((d) => d.type === "licence") ?? null;
  const id = docs.find((d) => d.type === "id" || d.type === "passport") ?? null;

  const onSaveDoc = async (saved: UserDocument) => {
    setDocs((curr) => {
      const others = (curr ?? []).filter((d) => d.type !== saved.type);
      return [...others, saved];
    });
    toast.success("Document saved.");
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="headline-xl text-ink-100">Documents</h1>
        <p className="body-md text-ink-60 mt-1">
          Upload your licence and ID once — every future booking pre-fills from here.
        </p>
      </header>

      <section aria-labelledby="dv-licence" className="flex flex-col gap-3">
        <h2 id="dv-licence" className="text-ink-50 overline">
          Driver&apos;s licence
        </h2>
        <DocumentVaultCard
          title="Driver's licence"
          document={licence}
          onReplace={() => {
            // Modal is mounted unconditionally below via the trigger.
          }}
        />
        <UploadDocumentModal docType="licence" existing={licence} onSave={onSaveDoc}>
          <Button variant="secondary" size="sm" className="self-start">
            {licence ? "Replace licence" : "Upload licence"}
          </Button>
        </UploadDocumentModal>
      </section>

      <section aria-labelledby="dv-id" className="flex flex-col gap-3">
        <h2 id="dv-id" className="text-ink-50 overline">
          ID / Passport
        </h2>
        <DocumentVaultCard title="ID / Passport" document={id} />
        <UploadDocumentModal docType="id" existing={id} onSave={onSaveDoc}>
          <Button variant="secondary" size="sm" className="self-start">
            {id ? "Replace ID" : "Upload ID / passport"}
          </Button>
        </UploadDocumentModal>
      </section>
    </div>
  );
}

function UploadDocumentModal({
  docType,
  existing,
  onSave,
  children,
}: {
  docType: DocumentType;
  existing: UserDocument | null;
  onSave: (saved: UserDocument) => void;
  children: React.ReactNode;
}) {
  const [file, setFile] = React.useState<File | null>(null);
  const [number, setNumber] = React.useState(existing?.number ?? "");
  const [issueDate, setIssueDate] = React.useState(existing?.issueDate ?? "");
  const [expiryDate, setExpiryDate] = React.useState(existing?.expiryDate ?? "");
  const [country, setCountry] = React.useState(existing?.issuingCountry ?? "LB");
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const saved: UserDocument = {
      id: existing?.id ?? `doc-${Math.random().toString(36).slice(2, 8)}`,
      userId: existing?.userId ?? "user-demo",
      type: docType,
      number: number.trim(),
      issueDate,
      expiryDate,
      issuingCountry: country,
      scanUrl: file?.name,
      status: "pending",
      uploadedAt: new Date().toISOString(),
    };
    onSave(saved);
    setSaving(false);
  };

  return (
    <Modal>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>{existing ? "Replace document" : "Upload document"}</ModalTitle>
        <ModalDescription>
          PDF, JPG, or PNG up to 5 MB. We&apos;ll verify within 24 hours.
        </ModalDescription>
        <div className="mt-4 flex flex-col gap-3">
          <FileUpload
            label="Drag a file or browse"
            accept=".pdf,.jpg,.jpeg,.png"
            maxSizeBytes={5 * 1024 * 1024}
            files={file ? [file] : []}
            onFilesChange={(files) => setFile(files[0] ?? null)}
            onFileRemove={() => setFile(null)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Document number" required>
              {({ id }) => (
                <Input id={id} value={number} onChange={(e) => setNumber(e.target.value)} />
              )}
            </Field>
            <Field label="Issuing country" required>
              {({ id }) => (
                <Select id={id} value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Issue date" required>
              {({ id }) => (
                <Input
                  id={id}
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              )}
            </Field>
            <Field label="Expiry date" required>
              {({ id }) => (
                <Input
                  id={id}
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              )}
            </Field>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary">Cancel</Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!number || !issueDate || !expiryDate || saving}
            onClick={onSubmit}
          >
            Save document
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
