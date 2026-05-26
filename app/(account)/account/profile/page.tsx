"use client";

import * as React from "react";
import Link from "next/link";
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
    toast.success("Profile saved.");
    setSaving(false);
  };

  const dobLocked = Boolean(session.user.dob);

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-ink-60 overline">Profile</p>
        <h1 className="headline-xl text-ink-100">Your details.</h1>
        <p className="lead-md text-ink-60">
          Update your personal information and communication preferences.
        </p>
      </header>

      <form onSubmit={onSave} className="flex flex-col gap-5">
        <Card variant="default" className="flex flex-col gap-5">
          <h2 className="headline-md text-ink-100">Personal info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required>
              {({ id }) => (
                <Input
                  id={id}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              )}
            </Field>
            <Field label="Last name" required>
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
              label="Email"
              required
              helper={session.user.emailVerified ? "Verified" : "Pending verification"}
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
            <Field label="Mobile" helper="Used for WhatsApp updates.">
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
            <Field
              label="Date of birth"
              helper={
                dobLocked ? "Locked after first save — used for driver-age validation." : undefined
              }
            >
              {({ id }) => (
                <Input id={id} type="date" defaultValue={session.user.dob} disabled={dobLocked} />
              )}
            </Field>
            <Field label="Country of residence">
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
          <h2 className="headline-md text-ink-100">Preferences</h2>
          <Checkbox
            checked={whatsappOptIn}
            onCheckedChange={(c) => setWhatsappOptIn(c === true)}
            label="Send my booking updates via WhatsApp."
          />
          <Checkbox
            checked={marketing}
            onCheckedChange={(c) => setMarketing(c === true)}
            label="Send me occasional updates from Wheels."
          />
        </Card>

        <Card variant="default" className="flex flex-col gap-3">
          <h2 className="headline-md text-ink-100">Security</h2>
          <ChangePasswordModal>
            <Button variant="secondary" size="sm" className="self-start">
              Change password
            </Button>
          </ChangePasswordModal>
        </Card>

        <Button type="submit" variant="primary" size="md" className="self-start" loading={saving}>
          Save changes
        </Button>
      </form>

      <hr className="border-border" />

      <Card variant="default" className="flex flex-col gap-3">
        <h2 className="headline-md text-signal-red">Danger zone</h2>
        <p className="body-sm text-ink-60">
          Deleting your account removes your profile and saved cars. Past bookings stay in our
          records for tax and insurance compliance.
        </p>
        <DeleteAccountModal onConfirm={signOut}>
          <Button
            variant="tertiary"
            size="sm"
            className="text-signal-red hover:bg-signal-red-bg self-start"
          >
            Delete account
          </Button>
        </DeleteAccountModal>
      </Card>

      <Link href="/help/faq" className="label-md text-ink-60 underline-offset-2 hover:underline">
        Need help with your account? →
      </Link>
    </div>
  );
}

function ChangePasswordModal({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    toast.success("Password updated.");
    setCurrent("");
    setNext("");
    setSaving(false);
  };

  return (
    <Modal>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>Change password</ModalTitle>
        <ModalDescription>
          Pick a new password — at least 8 characters with a mix of letters and numbers.
        </ModalDescription>
        <div className="mt-4 flex flex-col gap-3">
          <Field label="Current password" required>
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
          <Field label="New password" required>
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
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary" loading={saving} onClick={onSubmit}>
            Update password
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
  const [emailEcho, setEmailEcho] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    await onConfirm();
    toast.info("Your account has been deleted.");
    if (typeof window !== "undefined") window.location.href = "/";
  };

  return (
    <Modal>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>Delete your account?</ModalTitle>
        <ModalDescription>This is permanent. Type your email to confirm.</ModalDescription>
        <div className="mt-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={emailEcho}
            onChange={(e) => setEmailEcho(e.target.value)}
            aria-label="Confirm by typing your email"
          />
        </div>
        <ModalFooter>
          <Button variant="secondary">Keep account</Button>
          <Button
            variant="cta"
            onClick={onSubmit}
            loading={submitting}
            disabled={!emailEcho || submitting}
          >
            Delete account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
