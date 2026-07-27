import { test } from "@playwright/test";
import {
  pickFirstVehicle,
  continueToProtection,
  pickSmartTier,
  fillDriverInfo,
  acceptTerms,
  waitForConfirmationHeading,
  submitCheckout,
  waitForPaymentMethods,
} from "./helpers/booking-flow";

const runLiveE2e = process.env.RUN_LIVE_E2E === "1";

/**
 * Full-funnel coverage: navigate from /vehicles?step=1 through the
 * three steps + checkout, exercising each currently supported payment method.
 *
 *   Cash     → Confirmed (or pending on demo API)
 *   Transfer → Pending
 *   OMT      → Pending
 *
 * Uses far-future dates via booking-flow helpers to avoid demo API 409s.
 * Run serially with RUN_LIVE_E2E=1; pauses between tests to reduce 429s.
 */

test.describe("checkout — supported payment methods", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  let liveCheckoutAttempt = 0;

  test.beforeEach(async () => {
    test.skip(!runLiveE2e, "Set RUN_LIVE_E2E=1 to run live Wizard checkout E2E.");
    if (liveCheckoutAttempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 45_000));
    }
    liveCheckoutAttempt += 1;
  });

  test("Cash path lands on a Confirmed booking", async ({ page }) => {
    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page, `e2e-cash-${Date.now()}@wheels.test`);
    await waitForPaymentMethods(page);
    await page.getByLabel(/Cash on pickup/i).click();
    await acceptTerms(page);
    await submitCheckout(page, /Confirm reservation/i);
    await waitForConfirmationHeading(page, /Your booking is (confirmed|pending)/i);
  });

  test("Bank transfer lands on Pending", async ({ page }) => {
    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page, `e2e-transfer-${Date.now()}@wheels.test`);
    await waitForPaymentMethods(page);
    await page.getByLabel(/Bank transfer/i).click();
    await acceptTerms(page);
    await submitCheckout(page, /Submit booking/i);
    await waitForConfirmationHeading(page, /Your booking is pending/i);
  });

  test("OMT path skips proof and lands on Pending", async ({ page }) => {
    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page, `e2e-omt-${Date.now()}@wheels.test`);
    await waitForPaymentMethods(page);
    await page.getByLabel(/OMT/i).click();
    await acceptTerms(page);
    await submitCheckout(page, /Submit booking/i);
    await waitForConfirmationHeading(page, /Your booking is pending/i);
  });
});
