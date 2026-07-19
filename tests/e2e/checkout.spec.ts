import { test, expect, type Page } from "@playwright/test";

/**
 * Full-funnel coverage: navigate from /book/select-vehicle through the
 * three steps + checkout, exercising each currently supported payment method.
 *
 *   Cash     → Confirmed
 *   Transfer → Pending
 *   OMT      → Pending
 *
 * Each test starts fresh so sessionStorage is clean.
 */

async function pickFirstVehicle(page: Page): Promise<void> {
  await page.goto("/vehicles");
  // Phase 7: vehicle cards link to /vehicles?selected=<slug> which expands
  // the matching card inline. The link is rendered as an <a>, not a <button>.
  await page
    .getByRole("link", { name: /Select/i })
    .first()
    .click();
  await page.getByRole("button", { name: /Next →/i }).click();
  await expect(page).toHaveURL(/\/book\/extras/);
}

async function continueToProtection(page: Page): Promise<void> {
  await page
    .locator("aside[aria-label='Booking summary']")
    .getByRole("button", { name: /Continue/i })
    .click();
  await expect(page).toHaveURL(/\/book\/protection/);
}

async function pickSmartTier(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: /^Select$/i })
    .nth(1)
    .click();
  await page
    .locator("aside[aria-label='Booking summary']")
    .getByRole("button", { name: /^Continue$/i })
    .click();
  await expect(page).toHaveURL(/\/book\/checkout/);
}

async function fillDriverInfo(page: Page): Promise<void> {
  await page.getByLabel("First name", { exact: false }).fill("Test");
  await page.getByLabel("Last name", { exact: false }).fill("Driver");
  await page.getByLabel("Email", { exact: false }).fill("test@example.com");
  await page.getByPlaceholder("70 123 456").fill("70123456");
  await page.getByLabel("Date of birth", { exact: false }).fill("1990-01-01");

  await page.getByLabel("Licence number", { exact: false }).fill("LB12345");
  await page.getByLabel("Issue date", { exact: false }).fill("2018-01-01");
  await page.getByLabel("Expiry date", { exact: false }).fill("2030-01-01");
}

async function acceptTerms(page: Page): Promise<void> {
  await page.getByLabel(/I agree to the Terms/i).check();
}

test.describe("checkout — supported payment methods", () => {
  test("Cash path lands on a Confirmed booking", async ({ page }) => {
    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page);
    await page.getByLabel(/Cash on pickup/i).click();
    await acceptTerms(page);
    await page
      .getByRole("button", { name: /Confirm reservation/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/book\/confirmation\/WRC-/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Your booking is confirmed/i })).toBeVisible();
  });

  test("Bank transfer lands on Pending", async ({ page }) => {
    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page);
    await page.getByLabel(/Bank transfer/i).click();
    await acceptTerms(page);
    await page
      .getByRole("button", { name: /Submit booking/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/book\/confirmation\/WRC-/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Your booking is pending/i })).toBeVisible();
  });

  test("OMT path skips proof and lands on Pending", async ({ page }) => {
    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page);
    await page.getByLabel(/OMT \/ Whish \/ Bob/i).click();
    await acceptTerms(page);
    await page
      .getByRole("button", { name: /Submit booking/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/book\/confirmation\/WRC-/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Your booking is pending/i })).toBeVisible();
  });
});
