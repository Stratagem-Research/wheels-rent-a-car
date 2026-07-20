"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
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
} from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { DocumentVaultCard } from "@/components/account/DocumentVaultCard";
import { DocumentScanPreview } from "@/components/account/DocumentScanPreview";
import { useSession } from "@/hooks/useSession";
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

type ModalMode = "upload" | "edit" | "replace";

export default function DocumentsPage() {
  const t = useTranslations("accountDocuments");
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

  const onSaveDoc = (saved: UserDocument) => {
    setDocs((curr) => {
      const withoutSlot =
        saved.type === "licence"
          ? (curr ?? []).filter((d) => d.type !== "licence")
          : (curr ?? []).filter((d) => d.type !== "id" && d.type !== "passport");
      return [...withoutSlot, saved];
    });
    toast.success(t("documentSaved"));
  };

  const onDeleteDoc = (deleted: UserDocument) => {
    setDocs((curr) => (curr ?? []).filter((d) => d.id !== deleted.id));
    toast.success(t("documentDeleted"));
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="headline-xl text-ink-100">{t("title")}</h1>
        <p className="body-md text-ink-60 mt-1">{t("subtitle")}</p>
      </header>

      <DocumentSection
        docType="licence"
        title={t("licenceCardTitle")}
        sectionLabel={t("licenceSection")}
        sectionId="dv-licence"
        uploadLabel={t("uploadLicence")}
        document={licence}
        onSave={onSaveDoc}
        onDelete={onDeleteDoc}
      />

      <DocumentSection
        docType="id"
        title={t("idCardTitle")}
        sectionLabel={t("idSection")}
        sectionId="dv-id"
        uploadLabel={t("uploadId")}
        document={id}
        onSave={onSaveDoc}
        onDelete={onDeleteDoc}
      />
    </div>
  );
}

function DocumentSection({
  docType,
  title,
  sectionLabel,
  sectionId,
  uploadLabel,
  document,
  onSave,
  onDelete,
}: {
  docType: DocumentType;
  title: string;
  sectionLabel: string;
  sectionId: string;
  uploadLabel: string;
  document: UserDocument | null;
  onSave: (saved: UserDocument) => void;
  onDelete: (deleted: UserDocument) => void;
}) {
  const t = useTranslations("accountDocuments");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [mode, setMode] = React.useState<ModalMode>("upload");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const openModal = (next: ModalMode) => {
    setMode(next);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!document) return;
    setDeleting(true);
    try {
      await api.delete(endpoints.accountDocumentById(document.id));
      onDelete(document);
      setDeleteOpen(false);
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section aria-labelledby={sectionId} className="flex flex-col gap-3">
      <h2 id={sectionId} className="text-ink-50 overline">
        {sectionLabel}
      </h2>
      <DocumentVaultCard
        title={title}
        document={document}
        onEdit={() => openModal("edit")}
        onReplace={() => openModal("replace")}
        onDelete={() => setDeleteOpen(true)}
      />
      {!document ? (
        <Button variant="secondary" size="sm" className="self-start" onClick={() => openModal("upload")}>
          {uploadLabel}
        </Button>
      ) : null}

      <UploadDocumentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={mode}
        docType={docType}
        existing={document}
        onSave={onSave}
      />

      <Modal open={deleteOpen} onOpenChange={setDeleteOpen}>
        <ModalContent size="sm">
          <ModalTitle>{t("deleteTitle")}</ModalTitle>
          <ModalDescription>{t("deleteDescription")}</ModalDescription>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              {t("cancel")}
            </Button>
            <Button variant="cta" loading={deleting} onClick={confirmDelete}>
              {t("delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}

function UploadDocumentModal({
  open,
  onOpenChange,
  mode,
  docType,
  existing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ModalMode;
  docType: DocumentType;
  existing: UserDocument | null;
  onSave: (saved: UserDocument) => void;
}) {
  const t = useTranslations("accountDocuments");
  const { session } = useSession();
  const [file, setFile] = React.useState<File | null>(null);
  const [number, setNumber] = React.useState(existing?.number ?? "");
  const [issueDate, setIssueDate] = React.useState(existing?.issueDate ?? "");
  const [expiryDate, setExpiryDate] = React.useState(existing?.expiryDate ?? "");
  const [country, setCountry] = React.useState(existing?.issuingCountry ?? "LB");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setFile(null);
    setNumber(existing?.number ?? "");
    setIssueDate(existing?.issueDate ?? "");
    setExpiryDate(existing?.expiryDate ?? "");
    setCountry(existing?.issuingCountry ?? "LB");
  }, [open, existing]);

  const title =
    mode === "edit" ? t("editDocument") : mode === "replace" ? t("replaceDocument") : t("uploadDocument");
  const showFile = mode !== "edit";
  const requireFile = mode === "replace" || mode === "upload";

  const onSubmit = async () => {
    if (!session?.user.id) return;
    if (requireFile && !file) {
      toast.error(t("fileRequired"));
      return;
    }
    setSaving(true);
    try {
      const form = new FormData();
      form.set("type", docType);
      form.set("number", number.trim());
      form.set("issueDate", issueDate);
      form.set("expiryDate", expiryDate);
      form.set("issuingCountry", country);
      if (file) form.set("file", file);

      const res = await fetch(endpoints.accountDocuments, {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = (await res.json()) as UserDocument;
      onSave(saved);
      onOpenChange(false);
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalTitle>{title}</ModalTitle>
        <ModalDescription>
          {mode === "edit" ? t("editDescription") : t("uploadDescription")}
        </ModalDescription>
        <div className="mt-4 flex flex-col gap-3">
          {mode === "replace" && existing?.scanUrl ? (
            <div className="flex flex-col gap-2">
              <p className="label-md text-ink-80">{t("currentScan")}</p>
              <DocumentScanPreview
                scanUrl={existing.scanUrl}
                alt={t("scanAlt", { title: t("currentScan") })}
                size="lg"
              />
            </div>
          ) : null}
          {showFile ? (
            <FileUpload
              label={t("dragOrBrowse")}
              accept=".pdf,.jpg,.jpeg,.png"
              maxSizeBytes={5 * 1024 * 1024}
              files={file ? [file] : []}
              onFilesChange={(files) => setFile(files[0] ?? null)}
              onFileRemove={() => setFile(null)}
            />
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("documentNumber")} required>
              {({ id }) => (
                <Input id={id} value={number} onChange={(e) => setNumber(e.target.value)} />
              )}
            </Field>
            <Field label={t("issuingCountry")} required>
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
            <Field label={t("issueDate")} required>
              {({ id }) => (
                <Input
                  id={id}
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              )}
            </Field>
            <Field label={t("expiryDate")} required>
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
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!number || !issueDate || !expiryDate || saving || (requireFile && !file)}
            onClick={onSubmit}
          >
            {t("saveDocument")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
