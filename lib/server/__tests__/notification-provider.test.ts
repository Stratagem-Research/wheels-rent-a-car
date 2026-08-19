import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn().mockResolvedValue({ messageId: "smtp-1" });
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({ sendMail }),
  },
}));

import {
  dispatchNotificationJob,
  renderNotificationTemplate,
  sendEmailNotification,
} from "@/lib/server/notification-provider";

describe("notification-provider", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NOTIFICATION_PROVIDER_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_ENCRYPTION;
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("renders booking_request_received as request, not confirmed", () => {
    const content = renderNotificationTemplate("booking_request_received", {
      ref: "WRC-1",
      vehicle: "Toyota Yaris",
    });
    expect(content.subject.toLowerCase()).toContain("request");
    expect(content.subject.toLowerCase()).not.toContain("confirmed");
    expect(content.html.toLowerCase()).toContain("request");
  });

  it("renders booking_cancelled as a confirmed cancellation", () => {
    const content = renderNotificationTemplate("booking_cancelled", {
      ref: "WRC-1",
      vehicle: "NISSAN MICRA",
    });
    expect(content.subject.toLowerCase()).toContain("cancelled");
    expect(content.html.toLowerCase()).toContain("cancelled");
    expect(content.html).toContain("NISSAN MICRA");
  });

  it("logs instead of sending when no SMTP/Resend in non-production", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const result = await sendEmailNotification({
      template: "booking_confirmation",
      recipient: "guest@example.com",
      payload: { ref: "WRC-1", vehicle: "Toyota Yaris" },
    });
    expect(result.provider).toBe("log");
    expect(info).toHaveBeenCalled();
  });

  it("sends via SMTP when SMTP env is configured", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_ENCRYPTION = "tls";
    process.env.NOTIFICATION_FROM_EMAIL = "bookings@wheelsrentacar.com.lb";
    process.env.NOTIFICATION_FROM_NAME = "Wheels";

    const result = await sendEmailNotification({
      template: "booking_request_received",
      recipient: "guest@example.com",
      payload: { ref: "WRC-1" },
    });

    expect(result.provider).toBe("smtp");
    expect(result.id).toBe("smtp-1");
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guest@example.com",
        subject: expect.stringContaining("request"),
      }),
    );
  });

  it("sends via Resend when API key is configured and SMTP is not", async () => {
    process.env.NOTIFICATION_PROVIDER_KEY = "re_test_key";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email-1" }),
    }) as unknown as typeof fetch;

    const result = await sendEmailNotification({
      template: "booking_confirmation",
      recipient: "guest@example.com",
      payload: { ref: "WRC-1" },
    });

    expect(result.provider).toBe("resend");
    expect(result.id).toBe("email-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws in production when neither SMTP nor Resend is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      sendEmailNotification({
        template: "booking_confirmation",
        recipient: "guest@example.com",
      }),
    ).rejects.toThrow(/Email is not configured/);
  });

  it("skips whatsapp channel in dispatchNotificationJob", async () => {
    const result = await dispatchNotificationJob({
      channel: "whatsapp",
      template: "booking_confirmation",
      recipient: "+96170000000",
      payload: { ref: "WRC-1" },
    });
    expect(result).toEqual({ provider: "skipped", reason: "whatsapp_not_configured" });
  });
});
