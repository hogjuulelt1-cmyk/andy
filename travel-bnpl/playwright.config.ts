import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const port = 3100;

// Claude Code cloud sessions ship a Chromium at /opt/pw-browsers/chromium and
// block `playwright install`; use it when present (or when pointed at one).
const preinstalledChromium = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
const launchOptions = existsSync(preinstalledChromium)
  ? { executablePath: preinstalledChromium }
  : undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    launchOptions,
  },
  // Korean users are mobile-first; test on a phone profile.
  projects: [
    { name: "mobile-chromium", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
