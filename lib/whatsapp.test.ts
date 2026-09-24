import { describe, expect, it } from "vitest";
import { whatsAppHref, whatsAppMessage } from "./whatsapp";
import { DEFAULT_CONTACT_SETTINGS, whatsAppDigits } from "./contact/settings";

describe("whatsapp helpers", () => {
  it("returns the default message for unknown contexts", () => {
    expect(whatsAppMessage("default")).toMatch(/question about renting a car/);
  });

  it("templates the PDP message with the model", () => {
    expect(whatsAppMessage("pdp", { model: "Toyota Corolla" })).toMatch(
      /interested in the Toyota Corolla/,
    );
  });

  it("templates the confirmation message with the ref", () => {
    expect(whatsAppMessage("confirmation", { ref: "WRC-260520-9KQ4" })).toMatch(/WRC-260520-9KQ4/);
  });

  it("builds a wa.me URL from the default contact number", () => {
    const url = whatsAppHref("default");
    const digits = whatsAppDigits(DEFAULT_CONTACT_SETTINGS.whatsapp);
    expect(url.startsWith(`https://wa.me/${digits}?text=`)).toBe(true);
    expect(url).toContain("renting%20a%20car");
  });

  it("strips separators from an admin-supplied number", () => {
    const url = whatsAppHref("default", {}, "+961 3 337 228");
    expect(url.startsWith("https://wa.me/9613337228?text=")).toBe(true);
  });
});
