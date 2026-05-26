import { describe, expect, it } from "vitest";
import { whatsAppHref, whatsAppMessage } from "./whatsapp";

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

  it("builds a wa.me URL with an encoded body", () => {
    const url = whatsAppHref("default");
    expect(url).toMatch(/^https:\/\/wa\.me\/9613XXXXXXX\?text=/);
    expect(url).toContain("renting%20a%20car");
  });
});
