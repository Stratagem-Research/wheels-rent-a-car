import { test, expect } from "@playwright/test";

/**
 * SearchBar — Phase 5 + 6 INK & SIGNAL behaviour.
 *
 * Hero search card opens its sub-popovers (date / time / location) and
 * submits to `/book/select-vehicle?...` (which Phase 7 forwards to
 * `/vehicles?step=1`).
 */
test.describe("search bar", () => {
  test("hero tabs render with Cars selected by default", async ({ page }) => {
    await page.goto("/");
    const cars = page.getByRole("tab", { name: /^Cars$/i });
    const longTerm = page.getByRole("tab", { name: /Long-term/i });
    await expect(cars).toHaveAttribute("aria-selected", "true");
    await expect(longTerm).toHaveAttribute("aria-selected", "false");
  });

  test("Pickup-location popover opens and lists branches", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /Pickup/i })
      .first()
      .click();
    // LocationPicker exposes branch buttons; Hazmieh is the only branch in Phase 1.
    await expect(page.getByText(/Hazmieh/i).first()).toBeVisible();
  });

  test("Show cars submits and lands on /book/select-vehicle → /vehicles?step=1", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .getByRole("button", { name: /Show cars/i })
      .first()
      .click();
    // Either we hit the direct funnel route or the Phase-7 redirect.
    await expect(page).toHaveURL(/(?:\/book\/select-vehicle|\/vehicles\?.*step=1)/);
  });
});
