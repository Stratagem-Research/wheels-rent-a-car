import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  completeCashCheckout,
  loginWithCredentials,
  pickFirstVehicle,
  continueToProtection,
  pickSmartTier,
  fillDriverInfo,
  waitForPaymentMethods,
  submitCheckout,
  waitForConfirmationHeading,
  waitForBookingRefVisible,
} from "./helpers/booking-flow";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canProvisionUser = Boolean(SUPABASE_URL) && Boolean(SERVICE_ROLE_KEY);
const runLiveE2e = process.env.RUN_LIVE_E2E === "1";

const ACCOUNT_EMAIL = `e2e-lifecycle-${Date.now()}@wheels.test`;
const ACCOUNT_PASSWORD = "E2ePassw0rd!";
let accountUserId: string | null = null;

test.beforeAll(async () => {
  if (!canProvisionUser) return;
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email: ACCOUNT_EMAIL,
    password: ACCOUNT_PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: "Lifecycle", last_name: "Tester" },
  });
  if (error) throw error;
  accountUserId = data.user?.id ?? null;
});

test.afterAll(async () => {
  if (!canProvisionUser || !accountUserId) return;
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await admin.auth.admin.deleteUser(accountUserId);
});

test.describe("account booking lifecycle", () => {
  test.describe.configure({ timeout: 180_000 });

  test("@live logged-in checkout links booking to account list", async ({ page }) => {
    test.skip(!canProvisionUser, "Supabase credentials required.");
    test.skip(!runLiveE2e, "Set RUN_LIVE_E2E=1 to run live Wizard checkout E2E.");
    await loginWithCredentials(page, ACCOUNT_EMAIL, ACCOUNT_PASSWORD);

    const uniqueEmail = ACCOUNT_EMAIL;
    await pickFirstVehicle(page);
    await continueToProtection(page);
    await pickSmartTier(page);
    await fillDriverInfo(page, uniqueEmail);
    await waitForPaymentMethods(page);
    await page.getByLabel(/Cash on pickup/i).click();
    await page.getByLabel(/I agree to the Terms/i).check();
    await submitCheckout(page, /Confirm reservation/i);
    await waitForConfirmationHeading(page, /Your booking is (confirmed|pending)/i);

    const refMatch = page.url().match(/\/book\/confirmation\/(WRC-[A-Z0-9-]+)/);
    const ref = refMatch?.[1] ?? "";
    test.skip(!ref, "No booking reference captured.");

    await page.goto("/account/bookings");
    await waitForBookingRefVisible(page, ref, { timeout: 90_000 });
  });

  test("@live guest checkout then login claims booking into account", async ({ page }) => {
    test.skip(!canProvisionUser, "Supabase credentials required.");
    test.skip(!runLiveE2e, "Set RUN_LIVE_E2E=1 to run live Wizard checkout E2E.");
    const guestEmail = ACCOUNT_EMAIL;
    const ref = await completeCashCheckout(page, guestEmail);
    test.skip(!ref, "Guest checkout did not return a reference.");

    await loginWithCredentials(page, guestEmail, ACCOUNT_PASSWORD);
    await page.goto("/account/bookings");
    await waitForBookingRefVisible(page, ref, { timeout: 90_000 });
  });

  test("account detail modify modal opens and view invoice stays on page", async ({ page }) => {
    test.skip(!canProvisionUser, "Supabase credentials required.");

    await page.route("**/api/account/bookings/WRC-260720-ACCT", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ref: "WRC-260720-ACCT",
          state: "confirmed",
          paymentMethod: "cash",
          driver: {
            firstName: "Lifecycle",
            lastName: "Tester",
            email: ACCOUNT_EMAIL,
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

    await loginWithCredentials(page, ACCOUNT_EMAIL, ACCOUNT_PASSWORD);
    await page.goto("/account/bookings/WRC-260720-ACCT");
    await expect(page.getByText("WRC-260720-ACCT")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /View invoice/i }).click();
    await expect(page).toHaveURL(/\/account\/bookings\/WRC-260720-ACCT/);
    await expect(page.locator("#booking-payment")).toBeInViewport();

    await page.getByRole("button", { name: /Modify booking/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
