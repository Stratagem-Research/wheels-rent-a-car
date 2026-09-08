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
import { LicenceScanFields } from "@/components/account/LicenceScanFields";
import { Card } from "@/components/ui/Card";
import { useSession } from "@/hooks/useSession";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { isLebaneseResident } from "@/lib/booking/identity-document";
import type { DocumentType, UserDocument } from "@/types/domain";

type AdditionalDriverRecord = {
  firstName: string;
  lastName: string;
  scanFrontUrl?: string;
  scanBackUrl?: string;
};

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
  const { session } = useSession();
  const [docs, setDocs] = React.useState<UserDocument[] | null>(null);
  const country = session?.user.country ?? "LB";
  const lebanese = isLebaneseResident(country);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ items: UserDocument[] }>(endpoints.accountDocuments);
        if (cancelled) return;
        setDocs(res.items);

        // No licence on file yet — check whether one of this customer's own
        // bookings already carries scan images (guest checkout before they
        // had an account) and fill the profile from those automatically.
        if (!res.items.some((d) => d.type === "licence" && (d.scanFrontUrl || d.scanBackUrl || d.scanUrl))) {
          try {
            const backfill = await api.post<{ document: UserDocument | null }>(
              endpoints.accountDocumentsBackfillLicence,
              {},
            );
            if (!cancelled && backfill.document?.scanFrontUrl) {
              setDocs((curr) => [
                ...(curr ?? []).filter((d) => d.type !== "licence"),
                backfill.document as UserDocument,
              ]);
            } else if (!cancelled) {
              const refreshed = await api.get<{ items: UserDocument[] }>(endpoints.accountDocuments);
              if (!cancelled) setDocs(refreshed.items);
            }
          } catch {
            // Best-effort — the customer can still upload their licence manually.
          }
        }
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
  const idCard = docs.find((d) => d.type === "id") ?? null;
  const passport = docs.find((d) => d.type === "passport") ?? null;

  const onSaveDoc = (saved: UserDocument) => {
    setDocs((curr) => {
      const withoutSlot = (curr ?? []).filter((d) => d.type !== saved.type);
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
        <h1 className="headline-lg text-ink-100">{t("title")}</h1>
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

      {lebanese ? (
        <>
          <DocumentSection
            docType="id"
            title={t("idCardTitle")}
            sectionLabel={t("idSection")}
            sectionId="dv-id"
            uploadLabel={t("uploadId")}
            document={idCard}
            onSave={onSaveDoc}
            onDelete={onDeleteDoc}
          />
          <DocumentSection
            docType="passport"
            title={t("passportCardTitle")}
            sectionLabel={t("passportSection")}
            sectionId="dv-passport"
            uploadLabel={t("uploadPassport")}
            document={passport}
            onSave={onSaveDoc}
            onDelete={onDeleteDoc}
          />
        </>
      ) : (
        <DocumentSection
          docType="passport"
          title={t("passportCardTitle")}
          sectionLabel={t("passportSection")}
          sectionId="dv-passport"
          uploadLabel={t("uploadPassport")}
          document={passport}
          onSave={onSaveDoc}
          onDelete={onDeleteDoc}
        />
      )}

      <AdditionalDriverSection />
    </div>
  );
}

function AdditionalDriverSection() {
  const t = useTranslations("accountDocuments");
  const [driver, setDriver] = React.useState<AdditionalDriverRecord | null | undefined>(undefined);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void api
      .get<{ driver: AdditionalDriverRecord | null }>(endpoints.accountAdditionalDriver)
      .then((res) => {
        if (!cancelled) setDriver(res.driver);
      })
      .catch(() => {
        if (!cancelled) setDriver(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasDriver = Boolean(driver?.firstName || driver?.scanFrontUrl || driver?.scanBackUrl);

  return (
    <section aria-labelledby="dv-additional-driver" className="flex flex-col gap-3">
      <h2 id="dv-additional-driver" className="text-ink-50 overline">
        {t("additionalDriverSection")}
      </h2>
      {driver === undefined ? (
        <Skeleton className="h-32 rounded-lg" />
      ) : hasDriver ? (
        <Card variant="default" className="flex flex-col gap-3 p-5">
          <div className="flex items-start gap-4">
            {driver!.scanFrontUrl || driver!.scanBackUrl ? (
              <div className="flex shrink-0 gap-2">
                {driver!.scanFrontUrl ? (
                  <DocumentScanPreview scanUrl={driver!.scanFrontUrl} alt={t("licenceFront")} size="sm" />
                ) : null}
                {driver!.scanBackUrl ? (
                  <DocumentScanPreview scanUrl={driver!.scanBackUrl} alt={t("licenceBack")} size="sm" />
                ) : null}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="headline-xs text-ink-95">
                {driver!.firstName} {driver!.lastName}
              </h3>
            </div>
          </div>
          <div>
            <Button variant="tertiary" size="sm" onClick={() => setModalOpen(true)}>
              {t("editDetails")}
            </Button>
          </div>
        </Card>
      ) : (
        <Card variant="outline" className="flex flex-col items-start gap-3 p-5">
          <div>
            <h3 className="headline-xs text-ink-95">{t("additionalDriverCardTitle")}</h3>
            <p className="body-sm text-ink-60">{t("noAdditionalDriver")}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
            {t("addAdditionalDriver")}
          </Button>
        </Card>
      )}

      <AdditionalDriverModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        existing={driver ?? null}
        onSave={(saved) => setDriver(saved)}
      />
    </section>
  );
}

function AdditionalDriverModal({
  open,
  onOpenChange,
  existing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: AdditionalDriverRecord | null;
  onSave: (saved: AdditionalDriverRecord) => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {open ? (
        <AdditionalDriverModalForm existing={existing} onOpenChange={onOpenChange} onSave={onSave} />
      ) : null}
    </Modal>
  );
}

function AdditionalDriverModalForm({
  existing,
  onOpenChange,
  onSave,
}: {
  existing: AdditionalDriverRecord | null;
  onOpenChange: (open: boolean) => void;
  onSave: (saved: AdditionalDriverRecord) => void;
}) {
  const t = useTranslations("accountDocuments");
  const [firstName, setFirstName] = React.useState(existing?.firstName ?? "");
  const [lastName, setLastName] = React.useState(existing?.lastName ?? "");
  const [frontFile, setFrontFile] = React.useState<File | null>(null);
  const [backFile, setBackFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      form.set("firstName", firstName.trim());
      form.set("lastName", lastName.trim());
      if (frontFile) form.set("fileFront", frontFile);
      if (backFile) form.set("fileBack", backFile);
      const res = await fetch(endpoints.accountAdditionalDriver, {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Save failed");
      const data = (await res.json()) as { driver: AdditionalDriverRecord };
      onSave(data.driver);
      toast.success(t("documentSaved"));
      onOpenChange(false);
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalContent size="md">
        <ModalTitle>{t("additionalDriverCardTitle")}</ModalTitle>
        <ModalDescription>{t("additionalDriverModalDescription")}</ModalDescription>
        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("additionalDriverFirstName")}>
              {({ id }) => (
                <Input id={id} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              )}
            </Field>
            <Field label={t("additionalDriverLastName")}>
              {({ id }) => (
                <Input id={id} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              )}
            </Field>
          </div>
          <LicenceScanFields
            frontFile={frontFile}
            backFile={backFile}
            frontUrl={existing?.scanFrontUrl}
            backUrl={existing?.scanBackUrl}
            onFrontChange={setFrontFile}
            onBackChange={setBackFile}
            frontLabel={t("licenceFront")}
            backLabel={t("licenceBack")}
            helper={t("uploadDescription")}
            required={false}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" loading={saving} onClick={onSubmit}>
            {t("saveDocument")}
          </Button>
        </ModalFooter>
      </ModalContent>
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
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {open ? (
        <UploadDocumentModalForm
          mode={mode}
          docType={docType}
          existing={existing}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      ) : null}
    </Modal>
  );
}

function UploadDocumentModalForm({
  mode,
  docType,
  existing,
  onOpenChange,
  onSave,
}: {
  mode: ModalMode;
  docType: DocumentType;
  existing: UserDocument | null;
  onOpenChange: (open: boolean) => void;
  onSave: (saved: UserDocument) => void;
}) {
  const t = useTranslations("accountDocuments");
  const { session } = useSession();
  const [file, setFile] = React.useState<File | null>(null);
  const [frontFile, setFrontFile] = React.useState<File | null>(null);
  const [backFile, setBackFile] = React.useState<File | null>(null);
  const [number, setNumber] = React.useState(existing?.number ?? "");
  const [issueDate, setIssueDate] = React.useState(existing?.issueDate ?? "");
  const [expiryDate, setExpiryDate] = React.useState(existing?.expiryDate ?? "");
  const [country, setCountry] = React.useState(existing?.issuingCountry ?? "LB");
  const [saving, setSaving] = React.useState(false);

  const title =
    mode === "edit" ? t("editDocument") : mode === "replace" ? t("replaceDocument") : t("uploadDocument");
  const isTwoSided = docType === "licence" || docType === "id";
  const showFile = mode !== "edit";
  const requireFile = mode === "replace" || mode === "upload";
  const hasFront = Boolean(frontFile || existing?.scanFrontUrl || existing?.scanUrl);
  const hasBack = Boolean(backFile || existing?.scanBackUrl);
  const twoSidedFileOk =
    mode === "edit" ||
    (mode === "upload" && Boolean(frontFile && backFile)) ||
    (mode === "replace" && Boolean(frontFile || backFile) && hasFront && hasBack);
  const fileOk = isTwoSided ? twoSidedFileOk : !requireFile || Boolean(file);

  const onSubmit = async () => {
    if (!session?.user.id) return;
    // Driver's licence and national ID uploads have no required metadata —
    // any subset of scans/number/dates can be saved and filled in later.
    if (!isTwoSided && requireFile && !file) {
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
      if (isTwoSided) {
        if (frontFile) form.set("fileFront", frontFile);
        if (backFile) form.set("fileBack", backFile);
      } else if (file) {
        form.set("file", file);
      }

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
    <ModalContent size={isTwoSided && showFile ? "md" : "sm"}>
        <ModalTitle>{title}</ModalTitle>

        <div className="mt-4 flex flex-col gap-3">
          {mode === "replace" && !isTwoSided && existing?.scanUrl ? (
            <div className="flex flex-col gap-2">
              <p className="label-md text-ink-80">{t("currentScan")}</p>
              <DocumentScanPreview
                scanUrl={existing.scanUrl}
                alt={t("scanAlt", { title: t("currentScan") })}
                size="lg"
              />
            </div>
          ) : null}
          {showFile && isTwoSided ? (
            <LicenceScanFields
              frontFile={frontFile}
              backFile={backFile}
              frontUrl={existing?.scanFrontUrl || existing?.scanUrl}
              backUrl={existing?.scanBackUrl}
              onFrontChange={setFrontFile}
              onBackChange={setBackFile}
              frontLabel={docType === "id" ? t("idFront") : t("licenceFront")}
              backLabel={docType === "id" ? t("idBack") : t("licenceBack")}
              helper={t("uploadDescription")}
              required={false}
            />
          ) : null}
          {showFile && !isTwoSided ? (
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
            <Field label={t("documentNumber")} required={!isTwoSided}>
              {({ id }) => (
                <Input id={id} value={number} onChange={(e) => setNumber(e.target.value)} />
              )}
            </Field>
            <Field label={t("issuingCountry")} required={!isTwoSided}>
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
            <Field label={t("issueDate")} required={!isTwoSided}>
              {({ id }) => (
                <Input
                  id={id}
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              )}
            </Field>
            <Field label={t("expiryDate")} required={!isTwoSided}>
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
            disabled={saving || (!isTwoSided && (!number || !issueDate || !expiryDate || !fileOk))}
            onClick={onSubmit}
          >
            {t("saveDocument")}
          </Button>
        </ModalFooter>
      </ModalContent>
  );
}
