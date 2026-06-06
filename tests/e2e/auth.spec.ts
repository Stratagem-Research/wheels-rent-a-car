import { test, expect } from "@playwright/test";

const hasSupabaseAuth =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

test.describe("auth & account gating @smoke", () => {
  test("middleware redirects /account to /login when signed out", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });

  test("login lands on /account dashboard", async ({ page }) => {
    test.skip(
      !hasSupabaseAuth,
      "Supabase auth environment variables are required for login smoke checks.",
    );
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email" }).fill("demo@wheels.local");
    await page.getByRole("textbox", { name: "Password" }).fill("anything");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(
      page.getByRole("heading", { name: /Good (morning|afternoon|evening), Demo/i }),
    ).toBeVisible();
  });

  test("forgot-password always shows success", async ({ page }) => {
    test.skip(
      !hasSupabaseAuth,
      "Supabase auth environment variables are required for forgot-password smoke checks.",
    );
    await page.goto("/forgot-password");
    await page.getByLabel("Email", { exact: false }).fill("nobody@example.com");
    await page.getByRole("button", { name: /Send reset link/i }).click();
    await expect(page.getByText(/Reset link sent/i)).toBeVisible();
  });
});
