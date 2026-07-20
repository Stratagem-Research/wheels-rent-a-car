import { test, expect } from "@playwright/test";

test.describe("booking availability funnel", () => {
  test("vehicles with pickupAt/returnAt carries dates in URL @smoke", async ({ page }) => {
    const pickupAt = "2027-05-10T10:00";
    const returnAt = "2027-05-13T10:00";
    await page.goto(
      `/vehicles?step=1&pickupType=branch&pickupLoc=br-hazmieh&pickupAt=${encodeURIComponent(pickupAt)}&returnAt=${encodeURIComponent(returnAt)}`,
    );
    await expect(page).toHaveURL(new RegExp(`pickupAt=${encodeURIComponent(pickupAt).replace(/[-]/g, "\\-")}`));
    await expect(page.getByRole("heading", { name: /Which car do you want/i })).toBeVisible();
  });

  test("409 submit redirect preserves search dates in URL", async ({ page }) => {
    const pickupAt = "2027-05-10T10:00";
    const returnAt = "2027-05-13T10:00";

    await page.route("**/api/booking/submit", async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ message: "Vehicle is not available for this period." }),
      });
    });

    // Seed sessionStorage with a complete draft at checkout.
    await page.goto("/book/checkout");
    await page.evaluate(
      ({ pickupAt, returnAt }) => {
        const draft = {
          pickup: { type: "branch", locationId: "br-hazmieh", datetime: pickupAt },
          return: { locationId: "br-hazmieh", datetime: returnAt },
          vehicle: { vehicleId: "wiz-131", rate: { type: "best-price", mileage: "capped-200km" } },
          extras: [],
          protectionTierId: "pt-basic",
          driver: {
            firstName: "E2E",
            lastName: "Test",
            email: "e2e@example.com",
            phone: "+96170000000",
            dob: "1990-01-01",
            licenceNumber: "E2E-1",
            licenceIssue: "2020-01-01",
            licenceExpiry: "2030-01-01",
            country: "LB",
          },
          paymentMethod: "cash",
          marketingConsent: false,
          whatsappOptIn: false,
        };
        sessionStorage.setItem(
          "wheels.booking.draft",
          JSON.stringify({ draft, ts: Date.now() }),
        );
      },
      { pickupAt, returnAt },
    );

    await page.reload();

    await page.getByLabel(/First name/i).fill("E2E");
    await page.getByLabel(/Last name/i).fill("Test");
    await page.getByLabel(/Email/i).fill("e2e@example.com");
    await page.getByLabel(/Date of birth/i).fill("1990-01-01");
    await page.getByLabel(/Licence number/i).fill("E2E-1");
    await page.getByLabel(/Issue date/i).fill("2020-01-01");
    await page.getByLabel(/Expiry date/i).fill("2030-01-01");
    await page.getByLabel(/Cash on pickup/i).check();
    await page.getByLabel(/I accept the/i).check();

    const submit = page.getByRole("button", { name: /Confirm reservation|Pay/i }).first();
    await submit.click();

    await expect(page).toHaveURL(/\/vehicles\?.*step=1/);
    await expect(page).toHaveURL(new RegExp(`pickupAt=${encodeURIComponent(pickupAt).replace(/[-]/g, "\\-")}`));
    await expect(page).toHaveURL(new RegExp(`returnAt=${encodeURIComponent(returnAt).replace(/[-]/g, "\\-")}`));
  });
});
