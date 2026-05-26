"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import { getConsent, setConsent } from "@/lib/analytics/dataLayer";

/**
 * Cookie consent banner per 00_global.md §7.
 *
 * Bottom-anchored over the chrome (z-50). Persistent until dismissed by
 * "Accept all" or by saving custom preferences. The dataLayer helpers
 * gate analytics events on the chosen consent — no choice => no analytics.
 */

export function CookieBanner() {
  const [visible, setVisible] = React.useState(false);

  // SSR-then-hydrate: server renders empty, client reveals once we've
  // checked localStorage. Intentional setState-in-effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const stored = getConsent();
    if (stored === null) setVisible(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const acceptAll = () => {
    setConsent("all");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className={cn(
        "bg-ink-100 text-paper fixed inset-x-0 bottom-0 z-50",
        "shadow-[var(--shadow-elevation-3)]",
      )}
    >
      <div className="mx-auto flex max-w-[var(--container-default)] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-10">
        <div className="body-sm text-paper/85 max-w-3xl">
          We use cookies to power the booking flow, remember your search, and (with your permission)
          understand how the site is used. Read our{" "}
          <Link
            href="/cookies"
            className="text-paper underline underline-offset-4 hover:no-underline"
          >
            Cookie Policy
          </Link>
          .
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <ManagePreferencesModal onSave={() => setVisible(false)} />
          <Button variant="primary-inverse" size="sm" onClick={acceptAll}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

function ManagePreferencesModal({ onSave }: { onSave: () => void }) {
  // Essential is always on; user toggles analytics/marketing as one bucket.
  const [analytics, setAnalytics] = React.useState(false);

  const save = () => {
    setConsent(analytics ? "all" : "essential-only");
    onSave();
  };

  return (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary-inverse" size="sm">
          Manage preferences
        </Button>
      </ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>Cookie preferences</ModalTitle>
        <ModalDescription>
          Choose which cookies you allow. Essential cookies are always on.
        </ModalDescription>
        <div className="mt-4 flex flex-col gap-4">
          <PreferenceRow
            title="Essential"
            body="Required for the booking flow, sign-in, and search-state persistence."
            value
            disabled
          />
          <PreferenceRow
            title="Analytics & marketing"
            body="Helps us understand how the site is used and personalise the experience. GA4 + Meta Pixel."
            value={analytics}
            onChange={setAnalytics}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={onSave}>
            Reject all
          </Button>
          <Button variant="primary" onClick={save}>
            Save preferences
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function PreferenceRow({
  title,
  body,
  value,
  onChange,
  disabled,
}: {
  title: string;
  body: string;
  value: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="bg-ink-10 flex items-start justify-between gap-3 rounded-xl p-4">
      <div className="min-w-0">
        <div className="headline-xs text-ink-100">{title}</div>
        <p className="body-sm text-ink-60 mt-1">{body}</p>
      </div>
      <Switch
        checked={value}
        onCheckedChange={(c) => onChange?.(c === true)}
        disabled={disabled}
        aria-label={title}
      />
    </div>
  );
}
