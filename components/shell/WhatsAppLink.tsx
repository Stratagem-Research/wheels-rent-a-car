"use client";

import * as React from "react";
import { useWhatsAppHref } from "@/components/providers/ContactSettingsProvider";
import type { WhatsAppContext, WhatsAppContextDetails } from "@/lib/whatsapp";

export interface WhatsAppLinkProps {
  context?: WhatsAppContext;
  details?: WhatsAppContextDetails;
  className?: string;
  children: React.ReactNode;
}

/**
 * Inline WhatsApp anchor bound to the admin-managed number. Exists so a
 * server component can drop in a WhatsApp link without reading the contact
 * settings itself — useful on routes that should stay dependency-free, like
 * 404 and /maintenance.
 */
export function WhatsAppLink({
  context = "default",
  details,
  className,
  children,
}: WhatsAppLinkProps) {
  const whatsAppHref = useWhatsAppHref();
  return (
    <a
      href={whatsAppHref(context, details)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
