import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

// Pre-seed cookie consent + dismiss the newsletter popup so the banner
// doesn't intercept clicks at the bottom of the viewport during smoke runs.
const storageState = {
  cookies: [],
  origins: [
    {
      origin: baseURL,
      localStorage: [
        { name: "wheels.consent", value: "all" },
        // 60 days in the future so the newsletter popup stays dismissed.
        {
          name: "wheels.newsletter.suppress",
          value: String(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      ],
    },
  ],
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  expect: {
    timeout: 15_000,
  },
  reporter: process.env.CI ? [["html"], ["github"]] : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    storageState,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: `${baseURL}/api/health`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },
});
