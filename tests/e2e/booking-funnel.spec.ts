import { test, expect } from "@playwright/test";
import { LIVE_PICKUP_AT, LIVE_RETURN_AT } from "./helpers/booking-flow";

test.describe("booking funnel front half", () => {
  test("step 1 → 2 → 3 keeps the draft alive @smoke", async ({ page }) => {
    await page.goto(
      `/vehicles?step=1&pickupType=branch&pickupLoc=br-hazmieh&pickupAt=${encodeURIComponent(LIVE_PICKUP_AT)}&returnAt=${encodeURIComponent(LIVE_RETURN_AT)}`,
    );

    await expect(page.getByRole("progressbar", { name: /Booking progress/i })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );

    await page
      .getByRole("link", { name: /Select/i })
      .first()
      .click();
    await expect(page.getByRole("button", { name: /Book Now/i })).toBeVisible();

    await page.getByRole("button", { name: /Book Now/i }).click();
    await expect(page).toHaveURL(/\/book\/extras/);
    await expect(page.getByRole("progressbar", { name: /Booking progress/i })).toHaveAttribute(
      "aria-valuenow",
      "2",
    );

    const firstSwitch = page.getByRole("switch", { name: /Additional driver/i });
    await firstSwitch.click();
    await expect(firstSwitch).toBeChecked();

    await page
      .locator("aside[aria-label='Booking summary']")
      .getByRole("button", { name: /Continue/i })
      .click();
    await expect(page).toHaveURL(/\/book\/protection/);
    await expect(page.getByRole("progressbar", { name: /Booking progress/i })).toHaveAttribute(
      "aria-valuenow",
      "3",
    );

    await expect(page.getByText(/Popular/i).first()).toBeVisible();

    await page
      .getByRole("button", { name: /^Select$/i })
      .first()
      .click();
  });
});
