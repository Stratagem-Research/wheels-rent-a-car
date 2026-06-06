import { expect, test } from "@playwright/test";

test.describe("i18n routing", () => {
  test("bare root renders default English locale @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("help page still serves localized copy from default catalog", async ({ page }) => {
    await page.goto("/help");
    await expect(page.getByRole("heading", { name: /How can we help/i })).toBeVisible();
  });
});
