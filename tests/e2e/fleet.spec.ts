import { test, expect } from "@playwright/test";

test.describe("fleet — inline expansion replaces the PDP", () => {
  test("listing renders results, card expands into the Sixt panel @smoke", async ({ page }) => {
    await page.goto("/vehicles");
    await expect(page.getByRole("heading", { name: /Which car do you want/i })).toBeVisible();

    // Click the first card → URL gains ?selected=<slug>
    const firstCard = page.getByRole("link", { name: /^Select/i }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await expect(page).toHaveURL(/\/vehicles\?.*selected=[a-z0-9-]+/);

    // Expanded panel exposes the singular red "Next" CTA.
    await expect(page.getByRole("button", { name: /^Next/i })).toBeVisible();
  });

  test("?selected= auto-expands the matching card on load @smoke", async ({ page }) => {
    await page.goto("/vehicles?selected=kia-cerato");
    // The expanded panel shows the close button + Ask on WhatsApp link.
    await expect(page.getByRole("button", { name: /Close selected vehicle/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ask on WhatsApp/i })).toBeVisible();
  });

  test("Next on an expanded card routes to /book/extras", async ({ page }) => {
    await page.goto("/vehicles?selected=kia-cerato");
    await page.getByRole("button", { name: /^Next/i }).click();
    await expect(page).toHaveURL(/\/book\/extras/);
  });

  test("/book/select-vehicle redirects to /vehicles?step=1", async ({ page }) => {
    await page.goto("/book/select-vehicle?pickupLoc=hazmieh");
    await expect(page).toHaveURL(/\/vehicles\?.*step=1/);
  });
});
