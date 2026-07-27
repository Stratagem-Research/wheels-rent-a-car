import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPaymentStatus = vi.fn();
const mockGetWhishClient = vi.fn();
const mockGetPaymentEventByExternalId = vi.fn();
const mockRecordPaymentEvent = vi.fn();
const mockAppendBookingState = vi.fn();
const mockDispatchWizardSync = vi.fn();

vi.mock("@/lib/payments/whish", () => ({
  getWhishClient: () => mockGetWhishClient(),
  parseCallbackUrl: (url: string) => {
    const parsed = new URL(url);
    return {
      externalId: Number(parsed.searchParams.get("externalId")),
      currency: parsed.searchParams.get("currency") as "USD" | "LBP" | null,
    };
  },
}));

vi.mock("@/lib/server/payment-events", () => ({
  getPaymentEventByExternalId: (...args: unknown[]) => mockGetPaymentEventByExternalId(...args),
  isTerminalPaymentSuccess: (status: string | null | undefined) =>
    status === "success" || status === "paid",
  recordPaymentEvent: (...args: unknown[]) => mockRecordPaymentEvent(...args),
  appendBookingState: (...args: unknown[]) => mockAppendBookingState(...args),
}));

vi.mock("@/lib/server/wizard-sync", () => ({
  dispatchWizardSync: (...args: unknown[]) => mockDispatchWizardSync(...args),
}));

import { GET } from "@/app/api/payments/whish/callback/success/route";

describe("GET /api/payments/whish/callback/success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetWhishClient.mockReturnValue({ getPaymentStatus: mockGetPaymentStatus });
    mockGetPaymentEventByExternalId.mockResolvedValue({
      booking_reference: "WRC-260721-TEST",
      currency: "USD",
      amount: 120.5,
      status: "awaiting_payment",
    });
    mockGetPaymentStatus.mockResolvedValue({
      collectStatus: "success",
      amount: 120.5,
      transactionId: "txn-1",
    });
    mockRecordPaymentEvent.mockResolvedValue(undefined);
    mockAppendBookingState.mockResolvedValue(undefined);
    mockDispatchWizardSync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("confirms payment and dispatches wizard sync on success", async () => {
    const request = new Request(
      "http://localhost/api/payments/whish/callback/success?externalId=12345&currency=USD",
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(mockDispatchWizardSync).toHaveBeenCalledTimes(1);
    expect(mockRecordPaymentEvent).toHaveBeenCalled();
  });

  it("is idempotent when payment already succeeded", async () => {
    mockGetPaymentEventByExternalId.mockResolvedValue({
      booking_reference: "WRC-260721-TEST",
      currency: "USD",
      amount: 120.5,
      status: "success",
    });

    const request = new Request(
      "http://localhost/api/payments/whish/callback/success?externalId=12345&currency=USD",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.idempotent).toBe(true);
    expect(mockGetPaymentStatus).not.toHaveBeenCalled();
    expect(mockDispatchWizardSync).not.toHaveBeenCalled();
  });

  it("rejects amount mismatch", async () => {
    mockGetPaymentStatus.mockResolvedValue({
      collectStatus: "success",
      amount: 99,
      transactionId: "txn-1",
    });

    const request = new Request(
      "http://localhost/api/payments/whish/callback/success?externalId=12345&currency=USD",
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(mockDispatchWizardSync).not.toHaveBeenCalled();
  });
});
