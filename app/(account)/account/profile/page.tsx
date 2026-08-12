"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { useSession } from "@/hooks/useSession";
import { Link } from "@/i18n/navigation";

const COUNTRIES = [
  { code: "LB", name: "Lebanon" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
];

export default function ProfilePage() {
  const t = useTranslations("accountProfile");
  const { session, ready, signOut } = useSession();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [mobile, setMobile] = React.useState("");
  const [country, setCountry] = React.useState("LB");
  const [marketing, setMarketing] = React.useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  // Seed form fields from the session once on first mount. Intentionally a
  // setState-in-effect because the session hydrates after SSR.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!ready || !session || hydrated) return;
    setFirstName(session.user.firstName);
    setLastName(session.user.lastName);
    setEmail(session.user.email);
    setMobile(session.user.phone ?? "");
    setCountry(session.user.country ?? "LB");
    setMarketing(session.user.preferences.marketing);
    setWhatsappOptIn(session.user.preferences.whatsappUpdates);
    setHydrated(true);
  }, [ready, session, hydrated]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!ready || !session) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Real backend: PATCH /api/account. Phase 1: optimistic local update only.
    await new Promise((r) => setTimeout(r, 400));
    toast.success(t("profileSaved"));
    setSaving(false);
  };

  const dobLocked = Boolean(session.user.dob);

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-ink-60 overline">{t("profileLabel")}</p>
        <h1 className="headline-xl text-ink-100">{t("title")}</h1>
        <p className="lead-md text-ink-60">{t("subtitle")}</p>
      </header>

      <form onSubmit={onSave} className="flex flex-col gap-5">
        <Card variant="default" className="flex flex-col gap-5">
          <h2 className="headline-md text-ink-100">{t("personalInfo")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("firstName")} required>
              {({ id }) => (
                <Input
                  id={id}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              )}
            </Field>
            <Field label={t("lastName")} required>
              {({ id }) => (
                <Input
                  id={id}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              )}
            </Field>
            <Field
              label={t("email")}
              required
              helper={session.user.emailVerified ? t("verified") : t("pendingVerification")}
            >
              {({ id }) => (
                <Input
                  id={id}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              )}
            </Field>
            <Field label={t("mobile")} helper={t("mobileHelper")}>
              {({ id }) => (
                <Input
                  id={id}
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  autoComplete="tel"
                />
              )}
            </Field>
            <Field label={t("dateOfBirth")} helper={dobLocked ? t("dobLockedHelper") : undefined}>
              {({ id }) => (
                <Input id={id} type="date" defaultValue={session.user.dob} disabled={dobLocked} />
              )}
            </Field>
            <Field label={t("countryOfResidence")}>
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
          </div>
        </Card>

        <Card variant="default" className="flex flex-col gap-4">
          <h2 className="headline-md text-ink-100">{t("preferences")}</h2>
   
          <Checkbox
            checked={marketing}
            onCheckedChange={(c) => setMarketing(c === true)}
            label={t("marketingUpdates")}
          />
        </Card>

        <Card variant="default" className="flex flex-col gap-3">
          <h2 className="headline-md text-ink-100">{t("security")}</h2>
          <ChangePasswordModal>
            <Button variant="secondary" size="sm" className="self-start">
              {t("changePassword")}
            </Button>
          </ChangePasswordModal>
        </Card>

        <Button type="submit" variant="primary" size="md" className="self-start" loading={saving}>
          {t("saveChanges")}
        </Button>
      </form>

      <hr className="border-border" />

      <Card variant="default" className="flex flex-col gap-3">
        <h2 className="headline-md text-signal-red">{t("dangerZone")}</h2>
        <p className="body-sm text-ink-60">{t("dangerDescription")}</p>
        <DeleteAccountModal onConfirm={signOut}>
          <Button
            variant="tertiary"
            size="sm"
            className="text-signal-red hover:bg-signal-red-bg self-start"
          >
            {t("deleteAccount")}
          </Button>
        </DeleteAccountModal>
      </Card>

      <Link href="/help/faq" className="label-md text-ink-60 underline-offset-2 hover:underline">
        {t("needHelp")} →
      </Link>
    </div>
  );
}

function ChangePasswordModal({ children }: { children: React.ReactNode }) {
  const t = useTranslations("accountProfile");
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    toast.success(t("passwordUpdated"));
    setCurrent("");
    setNext("");
    setSaving(false);
  };

  return (
    <Modal>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>{t("changePassword")}</ModalTitle>
        <ModalDescription>{t("changePasswordDescription")}</ModalDescription>
        <div className="mt-4 flex flex-col gap-3">
          <Field label={t("currentPassword")} required>
            {({ id }) => (
              <Input
                id={id}
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
            )}
          </Field>
          <Field label={t("newPassword")} required>
            {({ id }) => (
              <Input
                id={id}
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
              />
            )}
          </Field>
        </div>
        <ModalFooter>
          <Button variant="secondary">{t("cancel")}</Button>
          <Button variant="primary" loading={saving} onClick={onSubmit}>
            {t("updatePassword")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function DeleteAccountModal({
  onConfirm,
  children,
}: {
  onConfirm: () => Promise<void>;
  children: React.ReactNode;
}) {
  const t = useTranslations("accountProfile");
  const [emailEcho, setEmailEcho] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    await onConfirm();
    toast.info(t("accountDeleted"));
    if (typeof window !== "undefined") window.location.href = "/";
  };

  return (
    <Modal>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>{t("deleteAccountTitle")}</ModalTitle>
        <ModalDescription>{t("deleteAccountDescription")}</ModalDescription>
        <div className="mt-4">
          <Input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={emailEcho}
            onChange={(e) => setEmailEcho(e.target.value)}
            aria-label={t("confirmEmailAria")}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary">{t("keepAccount")}</Button>
          <Button
            variant="cta"
            onClick={onSubmit}
            loading={submitting}
            disabled={!emailEcho || submitting}
          >
            {t("deleteAccount")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
