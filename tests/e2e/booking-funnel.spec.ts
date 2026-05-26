import { test, expect } from "@playwright/test";

test.describe("booking funnel front half", () => {
  test("step 1 → 2 → 3 keeps the draft alive @smoke", async ({ page }) => {
    // Phase 7 — /book/select-vehicle now redirects to /vehicles?step=1.
    await page.goto("/book/select-vehicle");
    await page.waitForURL(/\/vehicles\?.*step=1/);

    // Stepper visible at step 1.
    await expect(page.getByRole("progressbar", { name: /Booking progress/i })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );

    // Click the first vehicle card → URL gains ?selected= → inline expansion.
    const firstCardLink = page.getByRole("link", { name: /^Select/i }).first();
    await firstCardLink.click();
    await expect(page.getByRole("button", { name: /^Next/i })).toBeVisible();

    // Confirm rate → routes to step 2.
    await page.getByRole("button", { name: /^Next/i }).click();
    await expect(page).toHaveURL(/\/book\/extras/);
    await expect(page.getByRole("progressbar", { name: /Booking progress/i })).toHaveAttribute(
      "aria-valuenow",
      "2",
    );

    // Toggle the first add-on switch (Additional driver).
    const firstSwitch = page.getByRole("switch", { name: /Additional driver/i });
    await firstSwitch.click();
    await expect(firstSwitch).toBeChecked();

    // Continue to step 3 via the summary-panel CTA (Continue).
    await page
      .locator("aside[aria-label='Booking summary']")
      .getByRole("button", { name: /Continue/i })
      .click();
    await expect(page).toHaveURL(/\/book\/protection/);
    await expect(page.getByRole("progressbar", { name: /Booking progress/i })).toHaveAttribute(
      "aria-valuenow",
      "3",
    );

    // Tier cards visible; Smart shows the Popular badge.
    await expect(page.getByText(/Popular/i).first()).toBeVisible();

    // Picking a tier enables the Continue CTA in the panel.
    await page
      .getByRole("button", { name: /^Select$/i })
      .first()
      .click();
  });
});
