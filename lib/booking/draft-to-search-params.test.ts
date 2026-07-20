import { describe, expect, it } from "vitest";
import type { BookingDraft } from "@/types/domain";
import {
  appendSearchContextFromParams,
  draftToSearchParams,
} from "@/lib/booking/draft-to-search-params";

describe("draftToSearchParams", () => {
  it("preserves search context for 409 recovery redirect", () => {
    const draft: BookingDraft = {
      pickup: {
        type: "branch",
        locationId: "br-hazmieh",
        datetime: "2026-07-21T10:00",
      },
      return: { locationId: "br-hazmieh", datetime: "2026-07-24T10:00" },
      extras: [],
      marketingConsent: false,
      whatsappOptIn: true,
    };
    const params = draftToSearchParams(draft);
    expect(params.get("step")).toBe("1");
    expect(params.get("pickupAt")).toBe("2026-07-21T10:00");
    expect(params.get("returnAt")).toBe("2026-07-24T10:00");
    expect(params.get("pickupLoc")).toBe("br-hazmieh");
    expect(params.get("pickupType")).toBe("branch");
  });
});

describe("appendSearchContextFromParams", () => {
  it("copies funnel search keys into a target URL", () => {
    const source = new URLSearchParams(
      "pickupType=branch&pickupLoc=br-hazmieh&pickupAt=2026-07-21T10%3A00&returnAt=2026-07-24T10%3A00",
    );
    const target = new URLSearchParams("vehicleId=wiz-174&rate=flexible");
    appendSearchContextFromParams(target, source);
    expect(target.get("vehicleId")).toBe("wiz-174");
    expect(target.get("pickupAt")).toBe("2026-07-21T10:00");
    expect(target.get("pickupLoc")).toBe("br-hazmieh");
  });
});
