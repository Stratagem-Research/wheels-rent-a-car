import { describe, expect, it } from "vitest";
import type { BookingDraft } from "@/types/domain";
import {
  appendFunnelParams,
  bookingStepHref,
  parseRateFromFunnelParams,
} from "@/lib/booking/funnel-params";

describe("funnel-params", () => {
  const draft: BookingDraft = {
    pickup: {
      type: "branch",
      locationId: "br-hazmieh",
      datetime: "2026-07-21T10:00",
    },
    return: { locationId: "br-hazmieh", datetime: "2026-07-24T10:00" },
    vehicle: {
      vehicleId: "wiz-174",
      vehicleSlug: "kia-sportage",
      rate: { type: "flexible", mileage: "unlimited" },
    },
    extras: [],
    marketingConsent: false,
    whatsappOptIn: true,
  };

  it("bookingStepHref carries vehicle + search context", () => {
    const href = bookingStepHref("/book/protection", draft);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("vehicleId")).toBe("wiz-174");
    expect(params.get("vehicleSlug")).toBe("kia-sportage");
    expect(params.get("pickupAt")).toBe("2026-07-21T10:00");
    expect(params.get("rate")).toBe("flexible");
  });

  it("appendFunnelParams merges source search params", () => {
    const target = new URLSearchParams();
    const source = new URLSearchParams("pickupAt=2026-07-21T10%3A00&returnAt=2026-07-24T10%3A00");
    appendFunnelParams(target, draft, source);
    expect(target.get("vehicleSlug")).toBe("kia-sportage");
    expect(target.get("returnAt")).toBe("2026-07-24T10:00");
  });

  it("parseRateFromFunnelParams reads rate + mileage", () => {
    const params = new URLSearchParams("rate=flexible&mileage=capped-200km");
    expect(parseRateFromFunnelParams(params)).toEqual({
      type: "flexible",
      mileage: "capped-200km",
    });
  });
});
