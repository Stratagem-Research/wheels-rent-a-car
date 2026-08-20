import { test, expect } from "@playwright/test";

/** Resolve a slug present in the current fleet (live Wizard sync uses short slugs like `cerato`, not fixture `kia-cerato`). */
async function firstVehicleSlug(page: import("@playwright/test").Page): Promise<string> {
  await page.goto("/vehicles");
  const href = await page.getByRole("link", { name: /^Select/i }).first().getAttribute("href");
  const slug = href ? new URL(href, "http://localhost").searchParams.get("selected") : null;
  if (!slug) throw new Error("No vehicle slug found on /vehicles");
  return slug;
}

test.describe("fleet — inline expansion replaces the PDP", () => {
  test("listing renders results, card expands into the Sixt panel @smoke", async ({ page }) => {
    await page.goto("/vehicles");
    await expect(page.getByRole("heading", { name: /Which car do you want/i })).toBeVisible();

    // Click the first card → URL gains ?selected=<slug>
    const firstCard = page.getByRole("link", { name: /^Select/i }).first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    await expect(page).toHaveURL(/\/vehicles\?.*selected=[a-z0-9-]+/);

    // Expanded panel exposes the singular red "Next" CTA.
    await expect(page.getByRole("button", { name: /^Next/i })).toBeVisible();
  });

  test("?selected= auto-expands the matching card on load @smoke", async ({ page }) => {
    const slug = await firstVehicleSlug(page);
    await page.goto(`/vehicles?selected=${slug}`);
    // The expanded panel shows the close button + Ask on WhatsApp link.
    await expect(page.getByRole("button", { name: /Close selected vehicle/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ask on WhatsApp/i })).toBeVisible();
  });

  test("Next on an expanded card routes to /book/extras with search context", async ({ page }) => {
    const selected = await firstVehicleSlug(page);
    await page.goto(
      `/vehicles?step=1&pickupType=branch&pickupLoc=br-hazmieh&pickupAt=2027-06-01T10%3A00&returnAt=2027-06-04T10%3A00&selected=${encodeURIComponent(selected)}`,
    );
    await page.getByRole("button", { name: /^Next/i }).click();
    await expect(page).toHaveURL(/\/book\/extras\?.*vehicleId=/);
    await expect(page).toHaveURL(new RegExp(`vehicleId=${selected}`));
    await expect(page).toHaveURL(/pickupAt=2027-06-01T10%3A00/);
  });

  test("/book/select-vehicle redirects to /vehicles?step=1", async ({ page }) => {
    await page.goto("/book/select-vehicle?pickupLoc=hazmieh");
    await expect(page).toHaveURL(/\/vehicles\?.*step=1/);
  });
});
