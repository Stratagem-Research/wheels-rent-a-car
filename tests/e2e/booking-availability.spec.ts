import { test, expect } from "@playwright/test";
import {
  LIVE_PICKUP_AT,
  LIVE_RETURN_AT,
  pickFirstVehicle,
  continueToProtection,
  pickSmartTier,
  fillDriverInfo,
  acceptTerms,
} from "./helpers/booking-flow";

test.describe("booking availability funnel", () => {
  test("vehicles with pickupAt/returnAt carries dates in URL @smoke", async ({ page }) => {
    const pickupAt = "2027-05-10T10:00";
    const returnAt = "2027-05-13T10:00";
    await page.goto(
      `/vehicles?step=1&pickupType=branch&pickupLoc=br-hazmieh&pickupAt=${encodeURIComponent(pickupAt)}&returnAt=${encodeURIComponent(returnAt)}`,
    );
    await expect(page).toHaveURL(new RegExp(`pickupAt=${encodeURIComponent(pickupAt).replace(/[-]/g, "\\-")}`));
    await expect(page.getByRole("heading", { name: /Which car do you want/i })).toBeVisible();
  });

  test("409 submit redirect preserves search dates in URL", async ({ page }) => {
    await page.route("**/api/booking/submit", async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ message: "Vehicle is not available for this period." }),
      });
    });

    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page, "e2e-409@example.com");
    await page.getByLabel(/Cash on pickup/i).click();
    await acceptTerms(page);

    await page
      .getByRole("button", { name: /Confirm reservation/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/vehicles\?.*step=1/, { timeout: 30_000 });
    await expect(page).toHaveURL(
      new RegExp(`pickupAt=${encodeURIComponent(LIVE_PICKUP_AT).replace(/[-]/g, "\\-")}`),
    );
    await expect(page).toHaveURL(
      new RegExp(`returnAt=${encodeURIComponent(LIVE_RETURN_AT).replace(/[-]/g, "\\-")}`),
    );
  });
});
