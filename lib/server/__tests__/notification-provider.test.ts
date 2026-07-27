import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dispatchNotificationJob, sendEmailNotification } from "@/lib/server/notification-provider";

describe("notification-provider", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.NOTIFICATION_PROVIDER_KEY;
    delete process.env.RESEND_API_KEY;
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("logs instead of sending when no Resend key in non-production", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const result = await sendEmailNotification({
      template: "booking_confirmation",
      recipient: "guest@example.com",
      payload: { ref: "WRC-1", vehicle: "Toyota Yaris" },
    });
    expect(result.provider).toBe("log");
    expect(info).toHaveBeenCalled();
  });

  it("sends via Resend when API key is configured", async () => {
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
