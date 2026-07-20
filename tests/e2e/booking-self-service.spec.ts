import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  completeCashCheckout,
  loginWithCredentials,
} from "./helpers/booking-flow";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canProvisionUser = Boolean(SUPABASE_URL) && Boolean(SERVICE_ROLE_KEY);
const runLiveE2e = process.env.RUN_LIVE_E2E === "1";

const SIGNED_IN_EMAIL = `e2e-self-service-${Date.now()}@wheels.test`;
const SIGNED_IN_PASSWORD = "E2ePassw0rd!";
let signedInUserId: string | null = null;

test.beforeAll(async () => {
  if (!canProvisionUser) return;
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email: SIGNED_IN_EMAIL,
    password: SIGNED_IN_PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: "Self", last_name: "Service" },
  });
  if (error) throw error;
  signedInUserId = data.user?.id ?? null;
});

test.afterAll(async () => {
  if (!canProvisionUser || !signedInUserId) return;
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await admin.auth.admin.deleteUser(signedInUserId);
});

test.describe("booking self-service", () => {
  test.describe.configure({ timeout: 90_000 });

  test("lookup form prefills ref and email from URL without nested helper paragraphs", async ({
    page,
  }) => {
    await page.goto(
      "/manage-booking?ref=WRC-260720-ZX3C&email=guest%40example.com",
    );
    await expect(page.getByLabel(/Booking reference/i)).toHaveValue("WRC-260720-ZX3C");
    await expect(page.getByLabel(/Email used at booking/i)).toHaveValue("guest@example.com");

    const nestedHelperPs = page.locator("p[id$='-helper'] p");
    await expect(nestedHelperPs).toHaveCount(0);
  });

  test("signed-in users are redirected away from manage-booking", async ({ page }) => {
    test.skip(!canProvisionUser, "Supabase credentials required for login redirect test.");
    await loginWithCredentials(page, SIGNED_IN_EMAIL, SIGNED_IN_PASSWORD);
    await page.goto("/manage-booking");
    await expect(page).toHaveURL(/\/account\/bookings/, { timeout: 15_000 });
  });

  test("confirmation modify opens a modal instead of a placeholder toast", async ({ page }) => {
    await page.route("**/api/booking/lookup", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ref: "WRC-260720-MOCK",
          state: "confirmed",
          paymentMethod: "cash",
          driver: {
            firstName: "Test",
            lastName: "Driver",
            email: "mock@example.com",
            phone: "+96170000000",
            dob: "1990-01-01",
            licenceNumber: "X",
            licenceIssue: "2020-01-01",
            licenceExpiry: "2030-01-01",
            country: "LB",
          },
          pickup: {
            type: "branch",
            locationId: "br-hazmieh",
            datetime: "2026-08-15T10:00:00.000Z",
          },
          return: {
            locationId: "br-hazmieh",
            datetime: "2026-08-22T10:00:00.000Z",
          },
          vehicleSnapshot: {
            make: "Toyota",
            model: "Yaris",
            category: "economy",
            images: [],
          },
          extras: [],
          protectionTierId: "pt-basic",
          price: { totalCents: 10000, depositCents: 0, discountCents: 0 },
        }),
      });
    });

    await page.goto("/book/confirmation/WRC-260720-MOCK?email=mock%40example.com");
    await page.getByRole("button", { name: /Modify/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Request a change/i)).toBeVisible();
  });

  test("confirmation cancel opens the two-step modal", async ({ page }) => {
    await page.route("**/api/booking/lookup", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ref: "WRC-260720-MOCK",
          state: "confirmed",
          paymentMethod: "cash",
          driver: {
            firstName: "Test",
            lastName: "Driver",
            email: "mock@example.com",
            phone: "+96170000000",
            dob: "1990-01-01",
            licenceNumber: "X",
            licenceIssue: "2020-01-01",
            licenceExpiry: "2030-01-01",
            country: "LB",
          },
          pickup: {
            type: "branch",
            locationId: "br-hazmieh",
            datetime: "2026-08-15T10:00:00.000Z",
          },
          return: {
            locationId: "br-hazmieh",
            datetime: "2026-08-22T10:00:00.000Z",
          },
          vehicleSnapshot: {
            make: "Toyota",
            model: "Yaris",
            category: "economy",
            images: [],
          },
          extras: [],
          protectionTierId: "pt-basic",
          price: { totalCents: 10000, depositCents: 0, discountCents: 0 },
        }),
      });
    });

    await page.goto("/book/confirmation/WRC-260720-MOCK?email=mock%40example.com");
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Request cancellation/i)).toBeVisible();
  });

  test("@live view invoice navigates to manage-booking with ref and email", async ({ page }) => {
    test.skip(!runLiveE2e, "Set RUN_LIVE_E2E=1 to run live Wizard checkout E2E.");
    const email = `e2e-invoice-${Date.now()}@wheels.test`;
    const ref = await completeCashCheckout(page, email);
    test.skip(!ref, "Live booking checkout did not return a reference.");

    await page.getByRole("button", { name: /View invoice/i }).click();
    await expect(page).toHaveURL(/\/manage-booking\?/);
    expect(page.url()).toContain(`ref=${encodeURIComponent(ref)}`);
    expect(page.url()).toContain(`email=${encodeURIComponent(email.toLowerCase())}`);
  });

  test("@live manage-booking lookup succeeds after checkout", async ({ page }) => {
    test.skip(!runLiveE2e, "Set RUN_LIVE_E2E=1 to run live Wizard checkout E2E.");
    const email = `e2e-lookup-${Date.now()}@wheels.test`;
    const ref = await completeCashCheckout(page, email);
    test.skip(!ref, "Live booking checkout did not return a reference.");

    await page.goto(
      `/manage-booking?ref=${encodeURIComponent(ref)}&email=${encodeURIComponent(email)}`,
    );
    await page.getByRole("button", { name: /Find my booking/i }).click();
    await expect(page.getByText(ref)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Modify/i })).toBeVisible();
  });
});
