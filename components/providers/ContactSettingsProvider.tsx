"use client";

import * as React from "react";
import type { ContactSettings } from "@/types/domain";
import { DEFAULT_CONTACT_SETTINGS, telHref as buildTelHref } from "@/lib/contact/settings";
import {
  whatsAppHref as buildWhatsAppHref,
  type WhatsAppContext,
  type WhatsAppContextDetails,
} from "@/lib/whatsapp";

/**
 * Carries the admin-managed contact numbers (/admin/contact) into every
 * client component. Seeded server-side in the root layout from
 * `getPublicContactSettings()`, so there's no loading flash and no extra
 * client fetch — the numbers are in the initial HTML.
 *
 * Server components read `getPublicContactSettings()` directly instead.
 */
const ContactSettingsContext = React.createContext<ContactSettings>(DEFAULT_CONTACT_SETTINGS);

export function ContactSettingsProvider({
  settings,
  children,
}: {
  settings: ContactSettings;
  children: React.ReactNode;
}) {
  return (
    <ContactSettingsContext.Provider value={settings}>{children}</ContactSettingsContext.Provider>
  );
}

/** The current phone + WhatsApp numbers, in international display form. */
export function useContactSettings(): ContactSettings {
  return React.useContext(ContactSettingsContext);
}

/** `tel:` href for the admin-managed phone number. */
export function useTelHref(): string {
  const { phone } = useContactSettings();
  return React.useMemo(() => buildTelHref(phone), [phone]);
}

/**
 * Context-aware `wa.me` deep-link builder bound to the admin-managed
 * WhatsApp number. Drop-in replacement for importing `whatsAppHref`
 * directly in a client component.
 */
export function useWhatsAppHref(): (
  context: WhatsAppContext,
  details?: WhatsAppContextDetails,
) => string {
  const { whatsapp } = useContactSettings();
  return React.useCallback(
    (context: WhatsAppContext, details: WhatsAppContextDetails = {}) =>
      buildWhatsAppHref(context, details, whatsapp),
    [whatsapp],
  );
}
