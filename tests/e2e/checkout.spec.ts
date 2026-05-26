import { test, expect, type Page } from "@playwright/test";

/**
 * Full-funnel coverage: navigate from /book/select-vehicle through the
 * three steps + checkout, exercising each payment method.
 *
 *   Card     → Confirmed
 *   Cash     → Confirmed
 *   Transfer → Pending (requires proof upload)
 *   OMT      → Pending (no proof needed)
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

test.describe("checkout — all payment methods @smoke", () => {
  test("Card path lands on a Confirmed booking", async ({ page }) => {
    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page);
    // BEY airport pickup requires flight number.
    // Card method (default selected once clicked).
    await page.getByLabel(/Credit \/ Debit card/i).click();
    await page.getByPlaceholder("4242 4242 4242 4242").fill("4242424242424242");
    await page.getByPlaceholder("MM/YY").fill("12/30");
    await page.getByPlaceholder("•••").fill("123");
    await page.getByPlaceholder("Full name as on card").fill("Test Driver");
    await acceptTerms(page);
    await page
      .getByRole("button", { name: /Pay & confirm/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/book\/confirmation\/WRC-/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Your booking is confirmed/i })).toBeVisible();
  });

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

  test("Bank transfer requires proof and lands on Pending", async ({ page }) => {
    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page);
    await page.getByLabel(/Bank transfer/i).click();
    await acceptTerms(page);
    // Submit without proof first — should be blocked by validation.
    await page
      .getByRole("button", { name: /Submit booking/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/book\/checkout/);
    // Upload a tiny PDF-like blob to satisfy the file requirement.
    await page.locator('input[type="file"]').setInputFiles({
      name: "proof.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%mock\n"),
    });
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
