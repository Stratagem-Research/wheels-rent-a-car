import { test, expect } from "@playwright/test";

test.describe("legal + utility pages @smoke", () => {
  test("/privacy renders the legal article layout", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByRole("navigation", { name: /On this page/i })).toBeVisible();
  });

  test("/terms renders", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /Terms & Conditions/i })).toBeVisible();
  });

  test("/cookies renders", async ({ page }) => {
    await page.goto("/cookies");
    await expect(page.getByRole("heading", { name: /Cookie Policy/i })).toBeVisible();
  });

  test("unknown route shows the 404 page", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /Wrong turn/i })).toBeVisible();
  });

  test("sitemap.xml is reachable and lists key routes", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBe(true);
    const body = await res.text();
    expect(body).toContain("/vehicles");
    expect(body).toContain("/about");
    expect(body).toContain("/help/faq");
  });

  test("robots.txt disallows account + checkout + api", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBe(true);
    const body = await res.text();
    expect(body).toContain("Disallow: /account/");
    expect(body).toContain("Disallow: /book/checkout");
    expect(body).toContain("Sitemap:");
  });
});
