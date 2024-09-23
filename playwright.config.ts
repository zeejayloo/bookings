import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: ".",

  reporter: "html",
  retries: 0,
  timeout: 10 * 60_000,
  workers: 1,

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    headless: false,
    screenshot: "on",
    trace: "on",
  },

  /* Projects */
  projects: [
    {
      name: "Book",
      testMatch: /\/src\/tests\/.*.spec.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
});
