import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPaymentEventByExternalId = vi.fn();
const mockRecordPaymentEvent = vi.fn();
const mockAppendBookingState = vi.fn();
const mockDispatchWizardSync = vi.fn();

vi.mock("@/lib/server/payment-events", () => ({
  getPaymentEventByExternalId: (...args: unknown[]) => mockGetPaymentEventByExternalId(...args),
  recordPaymentEvent: (...args: unknown[]) => mockRecordPaymentEvent(...args),
  appendBookingState: (...args: unknown[]) => mockAppendBookingState(...args),
}));

vi.mock("@/lib/server/wizard-sync", () => ({
  dispatchWizardSync: (...args: unknown[]) => mockDispatchWizardSync(...args),
}));

import { GET } from "@/app/api/payments/neo/callback/success/route";

describe("GET /api/payments/neo/callback/success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("WEBSITE_URL", "https://wheels.com.lb");
    mockGetPaymentEventByExternalId.mockResolvedValue({
      booking_reference: "WRC-260721-NEO",
      amount: 150,
      status: "awaiting_payment",
    });
    mockRecordPaymentEvent.mockResolvedValue(undefined);
    mockAppendBookingState.mockResolvedValue(undefined);
    mockDispatchWizardSync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("confirms sandbox payment and redirects when redirect param is present", async () => {
    const request = new Request(
      "https://wheels.com.lb/api/payments/neo/callback/success?external_id=9876543210&sandbox=1&amount=150&currency=USD&redirect=https%3A%2F%2Fwheels.com.lb%2Fbook%2Fconfirmation%2FWRC-260721-NEO",
    );
    const response = await GET(request);
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(mockDispatchWizardSync).toHaveBeenCalledTimes(1);
  });

  it("returns 404 for unknown external_id", async () => {
    mockGetPaymentEventByExternalId.mockResolvedValue(null);
    const request = new Request(
      "https://wheels.com.lb/api/payments/neo/callback/success?external_id=0",
    );
    const response = await GET(request);
    expect(response.status).toBe(404);
  });
});
