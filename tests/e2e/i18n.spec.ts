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

  test("cookie locale updates document language + direction", async ({ page, context }) => {
    await context.addCookies([{ name: "NEXT_LOCALE", value: "ar", url: "http://localhost:3000" }]);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await context.addCookies([{ name: "NEXT_LOCALE", value: "fr", url: "http://localhost:3000" }]);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("home hero copy switches across en / ar / fr", async ({ page, context }) => {
    await page.goto("/");
    await expect(page.getByText("Drive Lebanon,").first()).toBeVisible();

    await context.addCookies([{ name: "NEXT_LOCALE", value: "ar", url: "http://localhost:3000" }]);
    await page.goto("/");
    await expect(page.getByText("اكتشف لبنان،").first()).toBeVisible();

    await context.addCookies([{ name: "NEXT_LOCALE", value: "fr", url: "http://localhost:3000" }]);
    await page.goto("/");
    await expect(page.getByText("Conduisez le Liban,").first()).toBeVisible();
  });

  test("marketing page sections translate under a locale cookie", async ({ page, context }) => {
    // Long-term page: hero + tier section headings come from the longTerm catalog.
    await context.addCookies([{ name: "NEXT_LOCALE", value: "fr", url: "http://localhost:3000" }]);
    await page.goto("/long-term");
    await expect(page.getByRole("heading", { name: /Roulez plus longtemps/i })).toBeVisible();

    await context.addCookies([{ name: "NEXT_LOCALE", value: "ar", url: "http://localhost:3000" }]);
    await page.goto("/long-term");
    await expect(page.getByRole("heading", { name: /قُد لمدة أطول/ })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
