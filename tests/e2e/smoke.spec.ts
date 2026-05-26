import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home page renders @smoke", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Drive Lebanon/i })).toBeVisible();
    await expect(page).toHaveTitle(/Wheels Rent A Car/i);
  });
});
