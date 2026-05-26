import { test, expect } from "@playwright/test";

test.describe("content pages @smoke", () => {
  test("/about renders story + stats", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /We pick you up/i })).toBeVisible();
    await expect(page.getByText(/Our story/i)).toBeVisible();
    await expect(page.getByText(/rentals last year/i)).toBeVisible();
  });

  test("/help hub renders category cards + search bar", async ({ page }) => {
    await page.goto("/help");
    await expect(page.getByRole("heading", { name: /How can we help/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search for an answer/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Rental terms/i }).first()).toBeVisible();
  });

  test("/help/faq deep-links to a specific question via URL hash", async ({ page }) => {
    await page.goto("/help/faq#f-b-1");
    await expect(page.getByRole("heading", { name: /Frequently asked questions/i })).toBeVisible();
    await expect(page.getByText(/Use the search bar on the homepage/i)).toBeVisible();
  });

  test("/help/rental-terms renders the long-form layout with TOC", async ({ page }) => {
    await page.goto("/help/rental-terms");
    await expect(page.getByRole("heading", { name: /Rental terms/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /On this page/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Who can rent/i })).toBeVisible();
  });

  test("/contact renders all 3 channels", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /Get in touch/i })).toBeVisible();
    await expect(page.getByText(/Fastest reply/i)).toBeVisible();
    await expect(page.getByText(/Reply within 4h/i)).toBeVisible();
  });
});
