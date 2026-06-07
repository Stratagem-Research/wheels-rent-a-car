import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Real-auth smoke checks need a Supabase project AND the service-role key so we
// can provision a confirmed test user up front (signups may require email
// confirmation, which a browser test can't complete).
const canProvisionUser = Boolean(SUPABASE_URL) && Boolean(SERVICE_ROLE_KEY);

const TEST_EMAIL = `e2e-login-${Date.now()}@wheels.test`;
const TEST_PASSWORD = "E2ePassw0rd!";

let createdUserId: string | null = null;

test.beforeAll(async () => {
  if (!canProvisionUser) return;
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: "Demo", last_name: "User" },
  });
  if (error) throw error;
  createdUserId = data.user?.id ?? null;
});

test.afterAll(async () => {
  if (!canProvisionUser || !createdUserId) return;
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await admin.auth.admin.deleteUser(createdUserId);
});

test.describe("auth & account gating @smoke", () => {
  test("middleware redirects /account to /login when signed out", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });

  test("login lands on /account dashboard", async ({ page }) => {
    test.skip(
      !canProvisionUser,
      "Supabase URL + service-role key are required to provision the login smoke user.",
    );
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email" }).fill(TEST_EMAIL);
    await page.getByRole("textbox", { name: "Password" }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(
      page.getByRole("heading", { name: /Good (morning|afternoon|evening), Demo/i }),
    ).toBeVisible();
  });

  test("invalid credentials surface an error", async ({ page }) => {
    test.skip(
      !canProvisionUser,
      "Supabase auth environment variables are required for the invalid-credentials check.",
    );
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email" }).fill(TEST_EMAIL);
    await page.getByRole("textbox", { name: "Password" }).fill("definitely-wrong");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/Email or password incorrect/i)).toBeVisible();
  });

  test("forgot-password always shows success", async ({ page }) => {
    test.skip(
      !canProvisionUser,
      "Supabase auth environment variables are required for forgot-password smoke checks.",
    );
    await page.goto("/forgot-password");
    await page.getByLabel("Email", { exact: false }).fill("nobody@example.com");
    await page.getByRole("button", { name: /Send reset link/i }).click();
    await expect(page.getByText(/Reset link sent/i)).toBeVisible();
  });
});
