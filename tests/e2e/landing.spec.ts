import { test, expect } from "@playwright/test";

/**
 * Landing page — 8-section structure check per landingpage.md (Phase 11).
 * The smaller `home.spec.ts @smoke` covers the critical hero + tabs path;
 * this file covers the full structural acceptance.
 */
test.describe("landing page", () => {
  test("renders the 8 spec sections in order", async ({ page }) => {
    await page.goto("/");

    // Hero
    await expect(page.getByRole("heading", { level: 1, name: /Drive Lebanon/i })).toBeVisible();

    // Hero promo (Tripadvisor inverse block)
    await expect(page.getByRole("heading", { name: /trust at Hazmieh/i })).toBeVisible();

    // Categories — display-mega wordmarks
    await expect(page.getByRole("heading", { name: /Choose your drive/i })).toBeVisible();

    // Our Benefits — "Basics, covered."
    await expect(page.getByRole("heading", { name: /basics, covered/i })).toBeVisible();

    // Featured 4 Cars
    await expect(page.getByRole("heading", { name: /four you/i })).toBeVisible();

    // Explore Lebanon
    await expect(page.getByRole("heading", { name: /Explore Lebanon/i })).toBeVisible();

    // Long-term promo
    await expect(page.getByRole("heading", { name: /Drive longer/i })).toBeVisible();

    // Reviews (renders only when fixture has data — fixture seeds 3+)
    await expect(page.getByRole("heading", { name: /Trusted by the people/i })).toBeVisible();
  });

  test("category cards link to their /vehicles?category= filter", async ({ page }) => {
    await page.goto("/");
    for (const cat of ["sedan", "suv", "luxury", "7-seater"]) {
      const browse = page.getByRole("link", { name: new RegExp(`Browse ${cat}`, "i") }).first();
      await expect(browse).toHaveAttribute("href", new RegExp(`/vehicles\\?category=${cat}`));
    }
  });

  test("Featured 4 → View the full fleet routes to /vehicles", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /View the full fleet/i }).click();
    await expect(page).toHaveURL(/\/vehicles$/);
  });

  test("Long-term Get-a-quote CTA routes to /long-term", async ({ page }) => {
    await page.goto("/");
    // Locate the Get-a-quote link inside the inverse Long-term band.
    await page
      .getByRole("link", { name: /Get a quote/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/long-term$/);
  });
});
