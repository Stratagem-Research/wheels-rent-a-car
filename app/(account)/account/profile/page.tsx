"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
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
import { isValidPhoneNational, phoneValueFromStored, toE164 } from "@/lib/booking/phone";
import { api, ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

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
  const { session, ready, signOut, updateProfile } = useSession();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState({ countryIso: "LB", national: "" });
  const [phoneError, setPhoneError] = React.useState<string | undefined>();
  const [dob, setDob] = React.useState("");
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
    setPhone(phoneValueFromStored(session.user.phone, session.user.country ?? "LB"));
    setDob(session.user.dob ?? "");
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
    // Mobile is optional here, but must be a valid number if provided.
    if (phone.national.trim() && !isValidPhoneNational(phone.countryIso, phone.national)) {
      setPhoneError(t("mobileInvalid"));
      return;
    }
    setPhoneError(undefined);
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.national.trim() ? toE164(phone.countryIso, phone.national) : "",
        country,
        dob: dobLocked ? undefined : dob || undefined,
        marketing,
        whatsappUpdates: whatsappOptIn,
      });
      toast.success(t("profileSaved"));
    } catch {
      toast.error(t("profileSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const dobLocked = Boolean(session.user.dob);

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-ink-60 overline">{t("profileLabel")}</p>
        <h1 className="headline-lg text-ink-100">{t("title")}</h1>
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
                <Input id={id} type="email" value={email} autoComplete="email" disabled />
              )}
            </Field>
            <Field label={t("mobile")} error={phoneError}>
              {({ id, describedBy, invalid }) => (
                <PhoneInput
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={phone}
                  onValueChange={(next) => {
                    setPhone(next);
                    if (phoneError) setPhoneError(undefined);
                  }}
                />
              )}
            </Field>
            <Field label={t("dateOfBirth")} helper={dobLocked ? t("dobLockedHelper") : undefined}>
              {({ id }) => (
                <Input
                  id={id}
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={dobLocked}
                />
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
        <DeleteAccountModal accountEmail={session?.user.email ?? ""} onDeleted={signOut}>
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
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reset = () => {
    setCurrent("");
    setNext("");
    setError(null);
  };

  const onSubmit = async () => {
    if (next.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api.post(endpoints.accountChangePassword, {
        currentPassword: current,
        newPassword: next,
      });
      toast.success(t("passwordUpdated"));
      reset();
      setOpen(false);
    } catch (err) {
      const message =
        err instanceof ApiError && typeof err.body === "object" && err.body && "message" in err.body
          ? String((err.body as { message: unknown }).message)
          : t("passwordUpdateFailed");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) reset();
      }}
    >
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
          <Field label={t("newPassword")} required error={error ?? undefined}>
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
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={!current || !next}
            onClick={onSubmit}
          >
            {t("updatePassword")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function DeleteAccountModal({
  accountEmail,
  onDeleted,
  children,
}: {
  accountEmail: string;
  onDeleted: () => Promise<void>;
  children: React.ReactNode;
}) {
  const t = useTranslations("accountProfile");
  const [open, setOpen] = React.useState(false);
  const [emailEcho, setEmailEcho] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const emailMatches =
    emailEcho.trim().toLowerCase() === accountEmail.trim().toLowerCase() && accountEmail !== "";

  const onSubmit = async () => {
    if (!emailMatches) {
      setError(t("emailMismatch"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.delete(endpoints.account);
      // Deletion already invalidated the server session; this just clears
      // the client-side cache/cookie mirror in sync.
      await onDeleted();
      toast.info(t("accountDeleted"));
      if (typeof window !== "undefined") window.location.href = "/";
    } catch {
      setError(t("deleteAccountFailed"));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setEmailEcho("");
          setError(null);
        }
      }}
    >
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
            invalid={Boolean(error)}
          />
          {error ? <p className="field-error text-error mt-1">{error}</p> : null}
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t("keepAccount")}
          </Button>
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
