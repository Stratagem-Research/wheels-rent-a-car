"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
} from "@/components/ui/Modal";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

/**
 * Newsletter modal popup per 00_global.md §7.
 *
 *   - First fires 30 seconds after landing on the home page.
 *   - Once dismissed (or subscribed), suppressed for 30 days via
 *     localStorage `wheels.newsletter.suppress`.
 *   - Once per browser session (sessionStorage) so it doesn't re-fire
 *     after a router navigation within the same tab.
 */

const SUPPRESS_KEY = "wheels.newsletter.suppress";
const SESSION_KEY = "wheels.newsletter.shownThisSession";
const SUPPRESS_DAYS = 30;
const DELAY_MS = 30_000;

export function NewsletterPopup() {
  const t = useTranslations("consent");
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.sessionStorage.getItem(SESSION_KEY) === "1") return;
    try {
      const raw = window.localStorage.getItem(SUPPRESS_KEY);
      if (raw) {
        const until = Number(raw);
        if (Number.isFinite(until) && Date.now() < until) return;
      }
    } catch {
      // localStorage may be unavailable; assume not suppressed.
    }

    const id = window.setTimeout(() => {
      setOpen(true);
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
    }, DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      const until = Date.now() + SUPPRESS_DAYS * 24 * 60 * 60 * 1000;
      window.localStorage.setItem(SUPPRESS_KEY, String(until));
    } catch {
      // ignore
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError(t("emailInvalid"));
      return;
    }
    setSubmitting(true);
    try {
      // Phase 1: no /api/newsletter endpoint yet; fake the call.
      await new Promise((r) => setTimeout(r, 300));
      toast.success(t("newsletterThanks"));
      dismiss();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <ModalContent size="sm">
        <ModalTitle>{t("newsletterTitle")}</ModalTitle>
        <ModalDescription>{t("newsletterDescription")}</ModalDescription>
        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-3">
          <Field label={t("email")} required>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="email"
                autoComplete="email"
                aria-describedby={describedBy}
                invalid={invalid}
                placeholder={t("emailPlaceholder")}
                startAdornment={<Mail className="size-4" aria-hidden="true" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Field>
          {error ? <ErrorText>{error}</ErrorText> : null}
        </form>
        <ModalFooter>
          <Button variant="secondary" onClick={dismiss}>
            {t("noThanks")}
          </Button>
          <Button variant="cta" size="lg" loading={submitting} onClick={onSubmit}>
            {t("subscribe")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
