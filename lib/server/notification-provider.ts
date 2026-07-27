export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  provider: "resend" | "log";
  id?: string;
}

function getNotificationFromEmail(): string {
  return process.env.NOTIFICATION_FROM_EMAIL?.trim() || "bookings@wheelsrentacar.com.lb";
}

function getResendApiKey(): string | null {
  const key = process.env.NOTIFICATION_PROVIDER_KEY?.trim() || process.env.RESEND_API_KEY?.trim();
  if (!key || key.startsWith("replace-with")) return null;
  return key;
}

function renderTemplate(template: string, payload: Record<string, unknown>): { subject: string; html: string; text: string } {
  const ref = String(payload.ref ?? payload.bookingReference ?? "");
  const vehicle = String(payload.vehicle ?? "");
  switch (template) {
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

export async function sendEmailNotification(input: {
  template: string;
  recipient: string;
  payload?: Record<string, unknown>;
}): Promise<SendEmailResult> {
  const content = renderTemplate(input.template, input.payload ?? {});
  const apiKey = getResendApiKey();

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NOTIFICATION_PROVIDER_KEY is not configured.");
    }
    console.info("[notification-provider] log-only send", {
      to: input.recipient,
      subject: content.subject,
      template: input.template,
    });
    return { provider: "log" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getNotificationFromEmail(),
      to: [input.recipient],
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

export async function dispatchNotificationJob(job: {
  channel: string;
  template: string;
  recipient: string;
  payload?: Record<string, unknown> | null;
}): Promise<SendEmailResult | { provider: "skipped"; reason: string }> {
  if (job.channel === "whatsapp") {
    // WhatsApp API integration is pending Meta/Twilio setup — email fallback at enqueue time.
    return { provider: "skipped", reason: "whatsapp_not_configured" };
  }
  return sendEmailNotification({
    template: job.template,
    recipient: job.recipient,
    payload: (job.payload ?? {}) as Record<string, unknown>,
  });
}
