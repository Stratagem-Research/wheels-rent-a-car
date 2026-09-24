"use client";

import * as React from "react";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";
import { DEFAULT_CONTACT_SETTINGS, emailHref, telHref, whatsAppDigits } from "@/lib/contact/settings";
import type { ContactSettings } from "@/types/domain";

/**
 * /admin/contact — the phone + WhatsApp numbers used across the whole
 * customer site: header, footer, contact page, help pages, WhatsApp FAB,
 * every inline WhatsApp CTA, booking confirmation emails, and the
 * LocalBusiness JSON-LD. Edited here once, applied everywhere.
 *
 * GET/PUT /api/admin/contact.
 */
export default function AdminContactPage() {
  const [settings, setSettings] = React.useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/contact", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to load contact settings.");
      }
      const data = (await res.json()) as { settings: ContactSettings };
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to save contact settings.");
      }
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contact settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Settings"
      title="Contact"
      description="The phone and WhatsApp numbers used everywhere on the customer site"
      backHref="/admin"
      backLabel="Back to dashboard"
    >
      <AdminFormShell
        title="Contact channels"
        helper="Enter both numbers as they should be dialed. A leading + is only needed for a number that requires a country code."
        footer={
          <Button onClick={() => void save()} loading={saving} disabled={loading}>
            Save contact settings
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Phone number"          >
            {({ id }) => (
              <Input
                id={id}
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="05 959 860"
                value={settings.phone}
                onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
              />
            )}
          </Field>
          <Field
            label="WhatsApp number"
          >
            {({ id }) => (
              <Input
                id={id}
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="+961 3 337 228"
                value={settings.whatsapp}
                onChange={(e) => setSettings((s) => ({ ...s, whatsapp: e.target.value }))}
              />
            )}
          </Field>
          <Field
            label="Customer email"
            className="sm:col-span-2"
          >
            {({ id }) => (
              <Input
                id={id}
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="hello@wheelsrentacar.com.lb"
                value={settings.email}
                onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
              />
            )}
          </Field>
        </div>

        <div className="border-border bg-ink-05 flex flex-col gap-2 rounded-lg border p-4">
          <p className="label-md text-ink-60">Resulting links</p>
          <p className="body-sm text-ink-100 flex items-center gap-2">
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            <code className="font-mono">{telHref(settings.phone)}</code>
          </p>
          <p className="body-sm text-ink-100 flex items-center gap-2">
            <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
            <code className="font-mono">https://wa.me/{whatsAppDigits(settings.whatsapp)}</code>
          </p>
          <p className="body-sm text-ink-100 flex items-center gap-2">
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            <code className="font-mono">{emailHref(settings.email)}</code>
          </p>
        </div>

        {error ? <p className="body-md text-danger">{error}</p> : null}

      </AdminFormShell>
    </AdminPageShell>
  );
}
