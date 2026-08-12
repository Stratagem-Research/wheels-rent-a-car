import nodemailer from "nodemailer";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  provider: "smtp" | "resend" | "log";
  id?: string;
}

function getNotificationFromName(): string {
  return process.env.NOTIFICATION_FROM_NAME?.trim() || "Wheels Rent A Car";
}

/**
 * Prefer explicit FROM; otherwise SMTP auth user (required for Gmail/Workspace);
 * last resort the production Wheels mailbox.
 */
function resolveFromAddress(smtpUser?: string): string {
  const explicit = process.env.NOTIFICATION_FROM_EMAIL?.trim();
  if (explicit) return explicit;
  if (smtpUser?.trim()) return smtpUser.trim();
  return "bookings@wheelsrentacar.com.lb";
}

function getNotificationFromEmail(): string {
  return resolveFromAddress();
}

function getResendApiKey(): string | null {
  const key = process.env.NOTIFICATION_PROVIDER_KEY?.trim() || process.env.RESEND_API_KEY?.trim();
  if (!key || key.startsWith("replace-with")) return null;
  return key;
}

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  encryption: "tls" | "ssl" | "none";
};

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !portRaw || !user || !pass) return null;
  if (pass.startsWith("replace-with")) return null;
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isFinite(port) || port <= 0) return null;
  const encRaw = (process.env.SMTP_ENCRYPTION?.trim() || "tls").toLowerCase();
  const encryption: SmtpConfig["encryption"] =
    encRaw === "ssl" || encRaw === "none" ? encRaw : "tls";
  return { host, port, user, pass, encryption };
}

/** Exported for unit tests. */
export function renderNotificationTemplate(
  template: string,
  payload: Record<string, unknown>,
): { subject: string; html: string; text: string } {
  const ref = String(payload.ref ?? payload.bookingReference ?? "");
  const vehicle = String(payload.vehicle ?? "");
  switch (template) {
    case "booking_request_received":
      return {
        subject: ref
          ? `We received your booking request — ${ref}`
          : "We received your booking request",
        html: `<p>Thank you — we have received your booking request${ref ? ` (<strong>${ref}</strong>)` : ""}.</p>${vehicle ? `<p>Vehicle: ${vehicle}</p>` : ""}<p>Our team will review it and email you once it is approved. This message confirms receipt of your request, not that payment has been verified.</p>`,
        text: `Thank you — we have received your booking request${ref ? ` (${ref})` : ""}.${vehicle ? ` Vehicle: ${vehicle}.` : ""} Our team will review it and email you once it is approved.`,
      };
    case "booking_confirmation":
      return {
        subject: ref ? `Wheels booking confirmed — ${ref}` : "Wheels booking confirmed",
        html: `<p>Your Wheels booking is confirmed${ref ? ` (<strong>${ref}</strong>)` : ""}.</p>${vehicle ? `<p>Vehicle: ${vehicle}</p>` : ""}<p>We will contact you before pickup with any final details.</p>`,
        text: `Your Wheels booking is confirmed${ref ? ` (${ref})` : ""}.${vehicle ? ` Vehicle: ${vehicle}.` : ""}`,
      };
    case "booking_cancel_requested":
      return {
        subject: ref ? `Cancellation request received — ${ref}` : "Cancellation request received",
        html: `<p>We received your cancellation request${ref ? ` for <strong>${ref}</strong>` : ""}. Our team will review it and email you once it is processed.</p>`,
        text: `We received your cancellation request${ref ? ` for ${ref}` : ""}.`,
      };
    case "booking_change_requested":
      return {
        subject: ref ? `Change request received — ${ref}` : "Change request received",
        html: `<p>We received your booking change request${ref ? ` for <strong>${ref}</strong>` : ""}. Our team will review it and contact you shortly.</p>`,
        text: `We received your booking change request${ref ? ` for ${ref}` : ""}.`,
      };
    default:
      return {
        subject: "Wheels notification",
        html: `<p>${template}</p><pre>${JSON.stringify(payload, null, 2)}</pre>`,
        text: `${template}\n${JSON.stringify(payload)}`,
      };
  }
}

async function sendViaSmtp(
  smtp: SmtpConfig,
  content: { subject: string; html: string; text: string },
  to: string,
): Promise<SendEmailResult> {
  const secure = smtp.encryption === "ssl";
  const requireTLS = smtp.encryption === "tls";
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure,
    requireTLS: requireTLS || undefined,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  // Gmail requires From to match the authenticated mailbox (or a allowed alias).
  const fromAddress = resolveFromAddress(smtp.user);
  try {
    const info = await transporter.sendMail({
      from: `"${getNotificationFromName()}" <${fromAddress}>`,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    return {
      provider: "smtp",
      id: typeof info.messageId === "string" ? info.messageId : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notification-provider] SMTP send failed", {
      host: smtp.host,
      port: smtp.port,
      user: smtp.user,
      from: fromAddress,
      to,
      error: message,
    });
    throw err;
  }
}

async function sendViaResend(
  apiKey: string,
  content: { subject: string; html: string; text: string },
  to: string,
): Promise<SendEmailResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${getNotificationFromName()} <${getNotificationFromEmail()}>`,
      to: [to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend API error (${response.status}): ${body || response.statusText}`);
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string };
  return { provider: "resend", id: data.id };
}

export async function sendEmailNotification(input: {
  template: string;
  recipient: string;
  payload?: Record<string, unknown>;
}): Promise<SendEmailResult> {
  const content = renderNotificationTemplate(input.template, input.payload ?? {});
  const smtp = getSmtpConfig();
  if (smtp) {
    return sendViaSmtp(smtp, content, input.recipient);
  }

  const apiKey = getResendApiKey();
  if (apiKey) {
    return sendViaResend(apiKey, content, input.recipient);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Email is not configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS (preferred) or NOTIFICATION_PROVIDER_KEY.",
    );
  }

  console.info("[notification-provider] log-only send", {
    to: input.recipient,
    subject: content.subject,
    template: input.template,
  });
  return { provider: "log" };
}

export async function dispatchNotificationJob(job: {
  channel: string;
  template: string;
  recipient: string;
  payload?: Record<string, unknown> | null;
}): Promise<SendEmailResult | { provider: "skipped"; reason: string }> {
  if (job.channel === "whatsapp") {
    // Launch: WhatsApp is customer-initiated wa.me only — no outbound API.
    return { provider: "skipped", reason: "whatsapp_not_configured" };
  }
  return sendEmailNotification({
    template: job.template,
    recipient: job.recipient,
    payload: (job.payload ?? {}) as Record<string, unknown>,
  });
}
