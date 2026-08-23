import { defineConfig } from "@playwright/test";

const remoteBaseURL = process.env.E2E_BASE_URL?.trim();

export default defineConfig({
  testDir: "./browser-tests",
  timeout: 60000,
  expect: { timeout: 30000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: remoteBaseURL || "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--renderer-process-limit=1"],
    },
  },
  ...(remoteBaseURL
    ? {}
    : {
        webServer: {
          command: "pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
          url: "http://127.0.0.1:4173",
          timeout: 30000,
          reuseExistingServer: false,
        },
      }),
});
