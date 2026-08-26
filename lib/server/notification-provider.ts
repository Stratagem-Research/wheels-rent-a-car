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
      return renderRichBookingEmail("requested", ref, vehicle, payload);
    case "booking_confirmation":
      return renderRichBookingEmail("confirmed", ref, vehicle, payload);
    case "booking_cancel_requested":
      return {
        subject: ref ? `Cancellation request received — ${ref}` : "Cancellation request received",
        html: brandShell(
          `<h1 style="margin:0 0 16px 0; font-size:22px; font-weight:800; color:#0a0a0a;">Cancellation request received</h1><p style="margin:0; font-size:15px; line-height:1.6; color:#404040;">We received your cancellation request${ref ? ` for <strong style="color:#0a0a0a;">${escapeHtml(ref)}</strong>` : ""}. Our team will review it and email you once it is processed.</p>`,
        ),
        text: `We received your cancellation request${ref ? ` for ${ref}` : ""}.`,
      };
    case "booking_cancelled":
      return {
        subject: ref ? `Wheels booking cancelled — ${ref}` : "Wheels booking cancelled",
        html: brandShell(
          `<h1 style="margin:0 0 16px 0; font-size:22px; font-weight:800; color:#0a0a0a;">Booking cancelled</h1><p style="margin:0 0 8px 0; font-size:15px; line-height:1.6; color:#404040;">Your Wheels booking has been cancelled${ref ? ` (<strong style="color:#0a0a0a;">${escapeHtml(ref)}</strong>)` : ""}.</p>${vehicle ? `<p style="margin:0 0 8px 0; font-size:15px; line-height:1.6; color:#404040;">Vehicle: ${escapeHtml(vehicle)}</p>` : ""}<p style="margin:0; font-size:15px; line-height:1.6; color:#404040;">If you did not request this, please contact us.</p>`,
        ),
        text: `Your Wheels booking has been cancelled${ref ? ` (${ref})` : ""}.${vehicle ? ` Vehicle: ${vehicle}.` : ""}`,
      };
    case "booking_change_requested":
      return {
        subject: ref ? `Change request received — ${ref}` : "Change request received",
        html: brandShell(
          `<h1 style="margin:0 0 16px 0; font-size:22px; font-weight:800; color:#0a0a0a;">Change request received</h1><p style="margin:0; font-size:15px; line-height:1.6; color:#404040;">We received your booking change request${ref ? ` for <strong style="color:#0a0a0a;">${escapeHtml(ref)}</strong>` : ""}. Our team will review it and contact you shortly.</p>`,
        ),
        text: `We received your booking change request${ref ? ` for ${ref}` : ""}.`,
      };
    default:
      return {
        subject: "Wheels notification",
        html: brandShell(`<p style="margin:0; font-size:15px; color:#404040;">${escapeHtml(template)}</p>`),
        text: `${template}\n${JSON.stringify(payload)}`,
      };
  }
}

const EMAIL_FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * Wraps an email body in the Wheels ink/paper/signal-red shell — wordmark
 * band, red hairline, card, footer — matching the rest of the site and the
 * branded Supabase auth templates (docs/email-templates/). Table-based
 * layout + inline styles throughout: required for Outlook/Gmail parity.
 */
function brandShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background-color:#f5f5f5; -webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff;">
            <tr>
              <td align="center" style="background-color:#000000; padding:28px 32px;">
                <span style="font-family:${EMAIL_FONT}; font-size:15px; font-weight:700; letter-spacing:3px; color:#ffffff; text-transform:uppercase;">
                  Wheels&nbsp;Rent&nbsp;A&nbsp;Car
                </span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#c8102e; height:4px; line-height:4px; font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px; font-family:${EMAIL_FONT}; color:#0a0a0a;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="border-top:1px solid #e5e5e5; font-size:0; line-height:0;">&nbsp;</td></tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 36px 40px; font-family:${EMAIL_FONT};">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#a3a3a3;">
                  Wheels Rent A Car · Hazmieh, Beirut, Lebanon · <a href="https://wa.me/9613100200" style="color:#a3a3a3;">WhatsApp support</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Uppercase red eyebrow label used above each section (price breakdown, etc). */
function emailEyebrow(label: string): string {
  return `<p style="margin:24px 0 8px 0; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#c8102e;">${escapeHtml(label)}</p>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function str(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function strList(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

type BookingEmailKind = "requested" | "confirmed";

const BOOKING_EMAIL_COPY: Record<
  BookingEmailKind,
  {
    subject: (ref: string) => string;
    headline: (ref: string) => string;
    textHeadline: (ref: string) => string;
    footer: string;
    minimalHtml: (ref: string, vehicle: string) => string;
    minimalText: (ref: string, vehicle: string) => string;
  }
> = {
  requested: {
    subject: (ref) =>
      ref ? `We received your booking request — ${ref}` : "We received your booking request",
    headline: (ref) =>
      `Thank you — we have received your booking request${ref ? ` (<strong style="color:#0a0a0a;">${escapeHtml(ref)}</strong>)` : ""}.`,
    textHeadline: (ref) =>
      `Thank you — we have received your booking request${ref ? ` (${ref})` : ""}.`,
    footer:
      "Our team will review it and email you once it is approved. This message confirms receipt of your request, not that payment has been verified.",
    minimalHtml: (ref, vehicle) =>
      brandShell(
        `<p style="margin:0 0 12px 0; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#c8102e;">Request received</p><h1 style="margin:0 0 16px 0; font-size:24px; line-height:1.3; font-weight:800; color:#0a0a0a;">Thank you — we've got your booking request</h1><p style="margin:0 0 8px 0; font-size:15px; line-height:1.6; color:#404040;">${ref ? `Reference <strong style="color:#0a0a0a;">${escapeHtml(ref)}</strong>` : ""}${vehicle ? `${ref ? " · " : ""}Vehicle: ${escapeHtml(vehicle)}` : ""}</p><p style="margin:0; font-size:15px; line-height:1.6; color:#404040;">Our team will review it and email you once it is approved. This message confirms receipt of your request, not that payment has been verified.</p>`,
      ),
    minimalText: (ref, vehicle) =>
      `Thank you — we have received your booking request${ref ? ` (${ref})` : ""}.${vehicle ? ` Vehicle: ${vehicle}.` : ""} Our team will review it and email you once it is approved.`,
  },
  confirmed: {
    subject: (ref) => (ref ? `Wheels booking confirmed — ${ref}` : "Wheels booking confirmed"),
    headline: (ref) =>
      `Your Wheels booking is confirmed${ref ? ` (<strong style="color:#0a0a0a;">${escapeHtml(ref)}</strong>)` : ""}.`,
    textHeadline: (ref) => `Your Wheels booking is confirmed${ref ? ` (${ref})` : ""}.`,
    footer: "We will contact you before pickup with any final details.",
    minimalHtml: (ref, vehicle) =>
      brandShell(
        `<p style="margin:0 0 12px 0; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#c8102e;">Booking confirmed</p><h1 style="margin:0 0 16px 0; font-size:24px; line-height:1.3; font-weight:800; color:#0a0a0a;">You're all set</h1><p style="margin:0 0 8px 0; font-size:15px; line-height:1.6; color:#404040;">${ref ? `Reference <strong style="color:#0a0a0a;">${escapeHtml(ref)}</strong>` : ""}${vehicle ? `${ref ? " · " : ""}Vehicle: ${escapeHtml(vehicle)}` : ""}</p><p style="margin:0; font-size:15px; line-height:1.6; color:#404040;">We will contact you before pickup with any final details.</p>`,
      ),
    minimalText: (ref, vehicle) =>
      `Your Wheels booking is confirmed${ref ? ` (${ref})` : ""}.${vehicle ? ` Vehicle: ${vehicle}.` : ""}`,
  },
};

/**
 * Rich booking email — dates/times, driver, extras, protection, full price
 * breakdown, and pickup/return location, when `payload` was built via
 * `buildBookingEmailPayload()`/`buildBookingConfirmationPayload()`. Shared
 * by the immediate "request received" email and the post-approval
 * "confirmed" email — same detail, different headline/footer copy. Falls
 * back to the old minimal ref+vehicle message if the caller couldn't attach
 * the rich details, so the email still sends either way.
 */
function renderRichBookingEmail(
  kind: BookingEmailKind,
  ref: string,
  vehicle: string,
  payload: Record<string, unknown>,
): { subject: string; html: string; text: string } {
  const copy = BOOKING_EMAIL_COPY[kind];
  const subject = copy.subject(ref);
  const pickupDate = str(payload, "pickupDate");
  const pickupTime = str(payload, "pickupTime");
  const returnDate = str(payload, "returnDate");
  const returnTime = str(payload, "returnTime");

  if (!pickupDate || !returnDate) {
    // No rich payload attached — degrade to the original minimal message.
    return {
      subject,
      html: copy.minimalHtml(ref, vehicle),
      text: copy.minimalText(ref, vehicle),
    };
  }

  const vehicleLabel = [str(payload, "vehicle") || vehicle, str(payload, "vehicleYear")]
    .filter(Boolean)
    .join(" · ");
  const driverName = str(payload, "driverName");
  const driverEmail = str(payload, "driverEmail");
  const driverPhone = str(payload, "driverPhone");
  const pickupLocation = str(payload, "pickupLocation");
  const returnLocation = str(payload, "returnLocation");
  const flightNumber = str(payload, "flightNumber");
  const paymentMethod = str(payload, "paymentMethod");
  const paymentMethodCode = str(payload, "paymentMethodCode");
  const paymentNote =
    paymentMethodCode === "omt"
      ? `Use this booking's reference — ${ref} — as your OMT payment code when paying at any OMT branch.`
      : paymentMethodCode === "transfer"
        ? `Include this booking's reference — ${ref} — with your bank transfer so we can match your payment.`
        : "";
  const protectionName = str(payload, "protectionName");
  const protectionPriceLabel = str(payload, "protectionPriceLabel");
  const extrasLines = strList(payload, "extrasLines");
  const priceDiscount = str(payload, "priceDiscount");

  const htmlRow = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:6px 16px 6px 0; font-size:14px; color:#737373; white-space:nowrap; vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0; font-size:14px; color:#0a0a0a;">${escapeHtml(value)}</td></tr>`
      : "";

  const textLine = (label: string, value: string) => (value ? `${label}: ${value}\n` : "");

  const eyebrowLabel = kind === "requested" ? "Request received" : "Booking confirmed";
  const headlineText =
    kind === "requested" ? "Thank you — we've got your booking request" : "You're all set";

  const html = brandShell(`
    <p style="margin:0 0 12px 0; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#c8102e;">${eyebrowLabel}</p>
    <h1 style="margin:0 0 12px 0; font-size:24px; line-height:1.3; font-weight:800; color:#0a0a0a;">${headlineText}</h1>
    <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#404040;">${copy.headline(ref)}</p>
    ${emailEyebrow("Trip details")}
    <table cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
      ${htmlRow("Vehicle", vehicleLabel)}
      ${htmlRow("Pickup", `${pickupDate} at ${pickupTime}${pickupLocation ? ` — ${pickupLocation}` : ""}`)}
      ${htmlRow("Return", `${returnDate} at ${returnTime}${returnLocation ? ` — ${returnLocation}` : ""}`)}
      ${htmlRow("Flight number", flightNumber)}
      ${htmlRow("Driver", driverName)}
      ${htmlRow("Email", driverEmail)}
      ${htmlRow("Phone", driverPhone)}
      ${htmlRow("Protection plan", protectionName ? `${protectionName}${protectionPriceLabel ? ` (${protectionPriceLabel})` : ""}` : "")}
      ${htmlRow("Payment method", paymentMethod)}
    </table>
    ${
      paymentNote
        ? `<p style="margin:16px 0 0 0; padding:12px 16px; font-size:14px; line-height:1.6; color:#0a0a0a; background:#f5f5f5; border-radius:8px;">${escapeHtml(paymentNote)}</p>`
        : ""
    }
    ${
      extrasLines.length > 0
        ? `${emailEyebrow("Selected extras")}<ul style="margin:0; padding-left:18px; font-size:14px; line-height:1.7; color:#0a0a0a;">${extrasLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
        : ""
    }
    ${emailEyebrow("Price breakdown")}
    <table cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
      ${htmlRow("Base rate", str(payload, "priceBaseRate"))}
      ${htmlRow("Extras", str(payload, "priceExtras"))}
      ${htmlRow("Protection", str(payload, "priceProtection"))}
      ${htmlRow("Taxes", str(payload, "priceTaxes"))}
      ${htmlRow("Fees", str(payload, "priceFees"))}
      ${priceDiscount ? htmlRow("Discount", `-${priceDiscount}`) : ""}
      <tr><td style="padding:12px 16px 6px 0; font-size:15px; font-weight:800; color:#0a0a0a; border-top:1px solid #e5e5e5;">Total</td><td style="padding:12px 0 6px 0; font-size:15px; font-weight:800; color:#0a0a0a; border-top:1px solid #e5e5e5;">${escapeHtml(str(payload, "priceTotal"))}</td></tr>
      ${htmlRow("Security deposit (refundable)", str(payload, "priceDeposit"))}
    </table>
    <p style="margin:28px 0 0 0; font-size:14px; line-height:1.6; color:#737373;">${copy.footer}</p>
  `);

  const text = [
    copy.textHeadline(ref),
    "",
    textLine("Vehicle", vehicleLabel),
    textLine("Pickup", `${pickupDate} at ${pickupTime}${pickupLocation ? ` — ${pickupLocation}` : ""}`),
    textLine("Return", `${returnDate} at ${returnTime}${returnLocation ? ` — ${returnLocation}` : ""}`),
    textLine("Flight number", flightNumber),
    textLine("Driver", driverName),
    textLine("Email", driverEmail),
    textLine("Phone", driverPhone),
    textLine("Protection plan", protectionName ? `${protectionName}${protectionPriceLabel ? ` (${protectionPriceLabel})` : ""}` : ""),
    textLine("Payment method", paymentMethod),
    paymentNote ? `\n${paymentNote}\n` : "",
    extrasLines.length > 0 ? `\nSelected extras:\n${extrasLines.map((l) => `- ${l}`).join("\n")}\n` : "",
    "\nPrice breakdown:",
    textLine("Base rate", str(payload, "priceBaseRate")),
    textLine("Extras", str(payload, "priceExtras")),
    textLine("Protection", str(payload, "priceProtection")),
    textLine("Taxes", str(payload, "priceTaxes")),
    textLine("Fees", str(payload, "priceFees")),
    priceDiscount ? textLine("Discount", `-${priceDiscount}`) : "",
    textLine("Total", str(payload, "priceTotal")),
    textLine("Security deposit (refundable)", str(payload, "priceDeposit")),
    `\n${copy.footer}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
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
