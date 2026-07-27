import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getCheckoutPaymentMethods,
  getEnabledCheckoutPaymentMethods,
  isPaymentMethodAvailable,
  isPaymentMethodEnabled,
} from "@/lib/server/payment-methods";

describe("payment-methods", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.WHISH_CHANNEL = "test-channel";
    process.env.WHISH_SECRET = "test-secret";
    process.env.NEO_MERCHANT_ID = "neo-merchant";
    process.env.NEO_API_KEY = "neo-key";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("enables cash, transfer, and OMT by default", () => {
    expect(isPaymentMethodEnabled("cash")).toBe(true);
    expect(isPaymentMethodEnabled("transfer")).toBe(true);
    expect(isPaymentMethodEnabled("omt")).toBe(true);
  });

  it("keeps online methods disabled until explicitly enabled", () => {
    expect(isPaymentMethodEnabled("whish-online")).toBe(false);
    expect(isPaymentMethodEnabled("neo")).toBe(false);
  });

  it("requires credentials for online methods to be available", () => {
    process.env.PAYMENT_METHOD_WHISH_ONLINE = "true";
    process.env.PAYMENT_METHOD_NEO = "true";
    expect(isPaymentMethodAvailable("whish-online")).toBe(true);
    expect(isPaymentMethodAvailable("neo")).toBe(true);

    delete process.env.WHISH_CHANNEL;
    expect(isPaymentMethodAvailable("whish-online")).toBe(false);
  });

  it("returns checkout-visible methods in display order", () => {
    const methods = getEnabledCheckoutPaymentMethods();
    expect(methods).toEqual(["cash", "transfer", "omt"]);
    expect(getCheckoutPaymentMethods().map((item) => item.method)).toEqual([
      "cash",
      "transfer",
      "omt",
      "whish-online",
      "neo",
    ]);
  });
});
