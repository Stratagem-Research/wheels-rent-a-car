import { expect, test, type Page } from "@playwright/test";

/** Far-future window to avoid demo API availability conflicts in live E2E runs. */
export const LIVE_PICKUP_AT = "2027-06-15T10:00";
export const LIVE_RETURN_AT = "2027-06-22T10:00";

export async function pickFirstVehicle(page: Page): Promise<void> {
  await page.goto(
    `/vehicles?step=1&pickupType=branch&pickupLoc=br-hazmieh&pickupAt=${encodeURIComponent(LIVE_PICKUP_AT)}&returnAt=${encodeURIComponent(LIVE_RETURN_AT)}`,
  );
  await page
    .getByRole("link", { name: /Select/i })
    .first()
    .click();
  await page.getByRole("button", { name: /Next →/i }).click();
  await expect(page).toHaveURL(/\/book\/extras/);
}

export async function continueToProtection(page: Page): Promise<void> {
  await page
    .locator("aside[aria-label='Booking summary']")
    .getByRole("button", { name: /Continue/i })
    .click();
  await expect(page).toHaveURL(/\/book\/protection/);
}

export async function pickSmartTier(page: Page): Promise<void> {
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

export async function fillDriverInfo(page: Page, email: string): Promise<void> {
  await page.getByLabel("First name", { exact: false }).fill("Test");
  await page.getByLabel("Last name", { exact: false }).fill("Driver");
  await page.getByLabel("Email", { exact: false }).fill(email);
  await page.getByPlaceholder("70 123 456").fill("70123456");
  await page.getByLabel("Date of birth", { exact: false }).fill("1990-01-01");
  await page.getByLabel("Licence number", { exact: false }).fill("LB12345");
  await page.getByLabel("Issue date", { exact: false }).fill("2018-01-01");
  await page.getByLabel("Expiry date", { exact: false }).fill("2030-01-01");
}

export async function acceptTerms(page: Page): Promise<void> {
  await page.getByLabel(/I agree to the Terms/i).check();
}

/**
 * Wizard lookup can lag a few seconds after submit; retry once on "Booking not found".
 */
export async function waitForConfirmationHeading(
  page: Page,
  heading: RegExp,
  timeout = 90_000,
): Promise<void> {
  await expect(page).toHaveURL(/\/book\/confirmation\/WRC-/, { timeout });

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const statusHeading = page.getByRole("heading", { name: heading });
    if (await statusHeading.isVisible().catch(() => false)) {
      return;
    }

    const notFound = page.getByRole("heading", { name: /Booking not found/i });
    if (await notFound.isVisible().catch(() => false)) {
      await page.reload();
      await page.waitForTimeout(2_000);
      continue;
    }

    await page.waitForTimeout(500);
  }

  await expect(page.getByRole("heading", { name: heading })).toBeVisible({ timeout: 5_000 });
}

/** Click checkout submit and skip when the demo Wizard API rate-limits (429). */
export async function submitCheckout(
  page: Page,
  buttonName: RegExp,
): Promise<void> {
  await page.getByRole("button", { name: buttonName }).first().click();

  try {
    await page.waitForURL(/\/book\/confirmation\/WRC-/, { timeout: 60_000 });
  } catch {
    const rateLimited = await page
      .getByText(/Too many requests/i)
      .isVisible()
      .catch(() => false);
    if (rateLimited) {
      test.skip(true, "Demo Wizard API returned 429 — re-run checkout E2E later.");
    }
    throw new Error("Checkout submit did not reach confirmation — see screenshot.");
  }
}

export async function completeCashCheckout(page: Page, email: string): Promise<string> {
  await pickFirstVehicle(page);
  await continueToProtection(page);
  await pickSmartTier(page);
  await fillDriverInfo(page, email);
  await page.getByLabel(/Cash on pickup/i).click();
  await acceptTerms(page);
  await page
    .getByRole("button", { name: /Confirm reservation/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/book\/confirmation\/(WRC-[A-Z0-9-]+)/, { timeout: 60_000 });
  const match = page.url().match(/\/book\/confirmation\/(WRC-[A-Z0-9-]+)/);
  return match?.[1] ?? "";
}

export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/account/, { timeout: 15_000 });
}
