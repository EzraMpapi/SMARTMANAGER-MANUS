import { devices, defineConfig } from "playwright/test";

const productionSmokeEnabled = process.env.E2E_BASE_URL === "https://smartmanager-manus-render.onrender.com";

export default defineConfig({
  testDir: "./browser-tests",
  testIgnore: productionSmokeEnabled ? undefined : ["**/productionSmoke.spec.ts"],
  timeout: 60000,
  expect: { timeout: 30000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=1"],
    },
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: productionSmokeEnabled ? undefined : {
    command: "node scripts/serve-build-for-e2e.mjs",
    url: "http://127.0.0.1:4173",
    timeout: 30000,
    reuseExistingServer: false,
  },
});
