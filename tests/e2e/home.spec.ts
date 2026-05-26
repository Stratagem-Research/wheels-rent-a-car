import { test, expect } from "@playwright/test";

test.describe("home", () => {
  test("hero renders and Show cars routes to /book/select-vehicle @smoke", async ({ page }) => {
    await page.goto("/");

    // Hero copy
    await expect(page.getByRole("heading", { name: /Drive Lebanon/i })).toBeVisible();

    // Search bar's red CTA — clicking should navigate to the funnel.
    const showCars = page.getByRole("button", { name: /Show cars/i }).first();
    await expect(showCars).toBeVisible();
    await showCars.click();
    await expect(page).toHaveURL(/\/book\/select-vehicle\?/);
  });

  test("categories section renders the four wordmark cards", async ({ page }) => {
    await page.goto("/");
    // Each CategoryWordmarkCard renders an "Explore" pill with an aria-label.
    for (const cat of ["sedan", "suv", "luxury", "7-seater"]) {
      const link = page.getByRole("link", { name: new RegExp(`Browse ${cat}`, "i") }).first();
      await expect(link).toHaveAttribute("href", new RegExp(`/vehicles\\?category=${cat}`));
    }
  });

  test("Long-term tab in HeroSearchTabs routes to /long-term", async ({ page }) => {
    await page.goto("/");
    const longTerm = page.getByRole("tab", { name: /Long-term/i });
    await longTerm.click();
    await expect(page).toHaveURL(/\/long-term$/);
  });
});
