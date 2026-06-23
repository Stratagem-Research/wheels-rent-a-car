import { test, expect } from "@playwright/test";

test.describe("service pages @smoke", () => {
  test("long-term page renders tiers + form", async ({ page }) => {
    await page.goto("/long-term");
    await expect(page.getByRole("heading", { name: /Drive longer/i })).toBeVisible();
    await expect(page.getByText(/Longer commitments unlock lower daily rates/i)).toBeVisible();
    await page
      .getByRole("link", { name: /Get a quote/i })
      .first()
      .click();
    await expect(page.getByRole("button", { name: /Send my enquiry/i })).toBeVisible();
  });

  test("chauffeur page renders categories + form", async ({ page }) => {
    await page.goto("/chauffeur");
    await expect(
      page.getByRole("heading", { name: /Sit back\.[\s\S]*We'll handle the driving/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Three ways to ride/i })).toBeVisible();
    await page
      .getByRole("button", { name: /Request airport transfer/i })
      .first()
      .click();
    await expect(page.getByRole("button", { name: /Send my enquiry/i })).toBeVisible();
  });

  test("corporate page renders tiers + enquiry form", async ({ page }) => {
    await page.goto("/corporate");
    await expect(page.getByRole("heading", { name: /Drive your[\s\S]*business/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Three sizes\. One way to drive\./i }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: /Get a quote/i })
      .first()
      .click();
    await expect(page.getByRole("button", { name: /Send my enquiry/i })).toBeVisible();
  });

  test("car wash page renders packages + form", async ({ page }) => {
    await page.goto("/car-wash");
    await expect(
      page.getByRole("heading", { name: /Spotless cars/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Pick your package/i })).toBeVisible();
    await page.getByRole("button", { name: /Request/i }).first().click();
    await expect(page.getByRole("button", { name: /Send my enquiry/i })).toBeVisible();
  });

  test("trips listing renders", async ({ page }) => {
    await page.goto("/trips");
    await expect(
      page.getByRole("heading", { name: /Plan your[\s\S]*Lebanon drive/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^All$/ })).toBeVisible();
  });

  test("itineraries listing renders", async ({ page }) => {
    await page.goto("/itineraries");
    await expect(
      page.getByRole("heading", { name: /Chauffeur-led[\s\S]*itineraries/i }),
    ).toBeVisible();
  });
});
