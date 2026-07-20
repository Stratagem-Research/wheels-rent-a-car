import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreatePayment = vi.fn();
const mockGenerateExternalId = vi.fn();
const mockRecordPaymentEvent = vi.fn();
const mockAppendBookingState = vi.fn();

vi.mock("@/lib/payments/whish", () => ({
  getWhishClient: () => ({
    generateExternalId: mockGenerateExternalId,
    createPayment: mockCreatePayment,
  }),
}));

vi.mock("@/lib/server/payment-events", () => ({
  recordPaymentEvent: (...args: unknown[]) => mockRecordPaymentEvent(...args),
  appendBookingState: (...args: unknown[]) => mockAppendBookingState(...args),
}));

import { POST } from "@/app/api/payments/whish/create/route";

describe("POST /api/payments/whish/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "srk");
    vi.stubEnv("DATABASE_URL", "postgres://postgres:pw@localhost:5432/postgres");
    vi.stubEnv("WHISH_CHANNEL", "channel");
    vi.stubEnv("WHISH_SECRET", "secret");
    vi.stubEnv("WEBSITE_URL", "https://wheels.com.lb");
    vi.stubEnv("WHEELS_INTERNAL_API_BASE_URL", "https://api.wheels.com.lb/api/v1");
    vi.stubEnv("WHEELS_INTERNAL_API_TOKEN", "token");
    mockGenerateExternalId.mockReturnValue(12345);
    mockCreatePayment.mockResolvedValue({
      success: true,
      collectUrl: "https://whish.test/pay",
    });
    mockRecordPaymentEvent.mockResolvedValue(undefined);
    mockAppendBookingState.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes customer email in Whish success redirect URL", async () => {
    const request = new Request("http://localhost/api/payments/whish/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingReference: "WRC-260720-ZX3C",
        customerEmail: "guest@example.com",
        amount: 120.5,
        currency: "USD",
        invoice: "Wheels booking WRC-260720-ZX3C",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mockCreatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        successRedirectUrl:
          "https://wheels.com.lb/book/confirmation/WRC-260720-ZX3C?email=guest%40example.com",
      }),
    );
  });

  it("rejects payload without customerEmail", async () => {
    const request = new Request("http://localhost/api/payments/whish/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingReference: "WRC-260720-ZX3C",
        amount: 120.5,
        invoice: "Wheels booking WRC-260720-ZX3C",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
