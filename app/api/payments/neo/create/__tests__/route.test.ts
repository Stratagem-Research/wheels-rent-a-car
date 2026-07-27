import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreatePayment = vi.fn();
const mockGenerateExternalId = vi.fn();
const mockRecordPaymentEvent = vi.fn();
const mockAppendBookingState = vi.fn();

vi.mock("@/lib/payments/neo", () => ({
  getNeoClient: () => ({
    generateExternalId: mockGenerateExternalId,
    createPayment: mockCreatePayment,
  }),
}));

vi.mock("@/lib/server/payment-events", () => ({
  recordPaymentEvent: (...args: unknown[]) => mockRecordPaymentEvent(...args),
  appendBookingState: (...args: unknown[]) => mockAppendBookingState(...args),
}));

import { POST } from "@/app/api/payments/neo/create/route";

describe("POST /api/payments/neo/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PAYMENT_METHOD_NEO", "true");
    vi.stubEnv("NEO_MERCHANT_ID", "neo-merchant");
    vi.stubEnv("NEO_API_KEY", "neo-key");
    vi.stubEnv("WEBSITE_URL", "https://wheels.com.lb");
    mockGenerateExternalId.mockReturnValue(9876543210);
    mockCreatePayment.mockResolvedValue({
      success: true,
      collectUrl: "https://wheels.com.lb/api/payments/neo/callback/success?external_id=9876543210",
    });
    mockRecordPaymentEvent.mockResolvedValue(undefined);
    mockAppendBookingState.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns collectUrl when NEO is enabled", async () => {
    const request = new Request("http://localhost/api/payments/neo/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingReference: "WRC-260721-NEO",
        customerEmail: "guest@example.com",
        amount: 150,
        currency: "USD",
        invoice: "Wheels booking WRC-260721-NEO",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.collectUrl).toContain("/api/payments/neo/callback/success");
    expect(mockRecordPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "neo", bookingReference: "WRC-260721-NEO" }),
    );
  });

  it("returns 503 when NEO is disabled", async () => {
    vi.stubEnv("PAYMENT_METHOD_NEO", "false");
    const request = new Request("http://localhost/api/payments/neo/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingReference: "WRC-260721-NEO",
        customerEmail: "guest@example.com",
        amount: 150,
        invoice: "test",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(503);
  });
});
