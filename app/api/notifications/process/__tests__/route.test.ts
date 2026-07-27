import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();
const mockDispatchNotificationJob = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/server/notification-provider", () => ({
  dispatchNotificationJob: (...args: unknown[]) => mockDispatchNotificationJob(...args),
}));

import { POST } from "@/app/api/notifications/process/route";

function mockOutboxWithJob(job: Record<string, unknown>) {
  const outboxChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [job], error: null }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
  const logsChain = {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
  mockFrom.mockImplementation((table: string) => {
    if (table === "notification_outbox") return outboxChain;
    if (table === "notification_logs") return logsChain;
    return outboxChain;
  });
}

describe("POST /api/notifications/process", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NOTIFICATION_CRON_SECRET;
    mockDispatchNotificationJob.mockResolvedValue({ provider: "log" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects unauthorized cron requests when secret is set", async () => {
    process.env.NOTIFICATION_CRON_SECRET = "cron-secret";
    const response = await POST(
      new Request("http://localhost/api/notifications/process", { method: "POST" }),
    );
    expect(response.status).toBe(401);
  });

  it("processes pending jobs when authorized", async () => {
    process.env.NOTIFICATION_CRON_SECRET = "cron-secret";
    mockOutboxWithJob({
      id: "job-1",
      booking_reference: "WRC-1",
      channel: "email",
      template: "booking_confirmation",
      recipient: "guest@example.com",
      payload: { ref: "WRC-1" },
      attempt_count: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/notifications/process", {
        method: "POST",
        headers: { authorization: "Bearer cron-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockDispatchNotificationJob).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "email", template: "booking_confirmation" }),
    );
  });

  it("falls back to email when whatsapp channel is skipped", async () => {
    mockOutboxWithJob({
      id: "job-2",
      booking_reference: "WRC-2",
      channel: "whatsapp",
      template: "booking_confirmation",
      recipient: "guest@example.com",
      payload: { ref: "WRC-2" },
      attempt_count: 0,
    });

    mockDispatchNotificationJob
      .mockResolvedValueOnce({ provider: "skipped", reason: "whatsapp_not_configured" })
      .mockResolvedValueOnce({ provider: "log" });

    const response = await POST(
      new Request("http://localhost/api/notifications/process", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(mockDispatchNotificationJob).toHaveBeenCalledTimes(2);
    expect(mockDispatchNotificationJob.mock.calls[1]?.[0]).toMatchObject({ channel: "email" });
  });
});
