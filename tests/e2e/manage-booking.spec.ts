import { test, expect } from "@playwright/test";

test.describe("manage booking + locations @smoke", () => {
  test("manage-booking shows the lookup form for guests", async ({ page }) => {
    await page.goto("/manage-booking");
    await expect(page.getByRole("heading", { name: /Find my booking/i })).toBeVisible();
    await expect(page.getByLabel(/Booking reference/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Find my booking/i })).toBeVisible();
  });

  test("invalid ref shows a generic error (no enumeration)", async ({ page }) => {
    await page.goto("/manage-booking");
    await page.getByLabel(/Booking reference/i).fill("WRC-260520-9KQ4");
    await page.getByLabel(/Email used at booking/i).fill("nobody@example.com");
    await page.getByRole("button", { name: /Find my booking/i }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /couldn't find that booking/i }),
    ).toHaveCount(1);
  });

  test("locations page renders the single Hazmieh branch", async ({ page }) => {
    await page.goto("/locations");
    await expect(page.getByRole("heading", { name: /Visit us in Hazmieh/i })).toBeVisible();
    await expect(page.getByText(/Hazmieh Gallery Semaan/i).first()).toBeVisible();
  });
});
