import { test } from "@playwright/test";
import {
  pickFirstVehicle,
  continueToProtection,
  pickSmartTier,
  fillDriverInfo,
  acceptTerms,
  submitCheckout,
  waitForConfirmationHeading,
} from "./helpers/booking-flow";

const runLiveE2e = process.env.RUN_LIVE_E2E === "1";

/**
 * Bank Audi NEO sandbox checkout — gated like other live Wizard E2E tests.
 * Requires PAYMENT_METHOD_NEO=true and NEO_MERCHANT_ID / NEO_API_KEY in env.
 */
test.describe("checkout — NEO sandbox", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test("NEO sandbox path lands on confirmation", async ({ page }) => {
    test.skip(!runLiveE2e, "Set RUN_LIVE_E2E=1 to run live NEO checkout E2E.");
    test.skip(
      process.env.PAYMENT_METHOD_NEO !== "true",
      "Set PAYMENT_METHOD_NEO=true to run NEO checkout E2E.",
    );

    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page, `e2e-neo-${Date.now()}@wheels.test`);
    await page.getByLabel(/Bank Audi NEO/i).click();
    await acceptTerms(page);
    await submitCheckout(page, /Continue to NEO/i);
    await waitForConfirmationHeading(page, /Your booking is (confirmed|pending)/i);
  });
});
