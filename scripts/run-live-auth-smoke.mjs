import { chromium, expect } from "playwright";

const baseURL = process.env.E2E_BASE_URL || "https://smartmanager-manus-render.onrender.com";
const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
if (!email || !password) {
  throw new Error("Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to the dedicated live test account.");
}
const target = new URL(baseURL);
if (target.protocol !== "https:" || target.hostname !== "smartmanager-manus-render.onrender.com") {
  throw new Error(`Refusing non-production target: ${target.origin}`);
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(`console: ${message.text()}`);
});

try {
  await page.goto(`${baseURL}/app`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /sign in securely/i }).click();
  await page.waitForTimeout(3000);

  const header = page.locator('header[aria-label="Workspace command bar"]');
  await expect(header).toBeVisible();
  await expect(header.getByText("SMART MANAGER", { exact: true })).toBeVisible();
  await expect(header.getByText("ERP SYSTEM", { exact: true })).toBeVisible();
  const search = header.getByRole("button", { name: "Search everything", exact: true });
  await expect(search).toBeVisible();
  await search.click();
  await expect(page.getByRole("dialog").first()).toBeVisible();
  await page.keyboard.press("Escape");
  const alertButton = header.getByRole("button", { name: /Open alerts/i });
  await expect(alertButton).toBeVisible();
  await alertButton.click();
  const themeToggle = header.getByRole("button", { name: /Switch to (light|dark) mode/i });
  await expect(themeToggle).toBeVisible();
  const themeBefore = await themeToggle.getAttribute("aria-pressed");
  await themeToggle.click();
  await expect(themeToggle).toHaveAttribute("aria-pressed", themeBefore === "true" ? "false" : "true");
  const notifications = header.getByRole("button", { name: /Notifications/i });
  await expect(notifications).toBeVisible();
  await notifications.click();
  await expect(header.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
  const profile = header.getByRole("button", { name: "Open account identity center", exact: true });
  await expect(profile).toBeVisible();
  await profile.click();
  await expect(page.locator("#workspace-profile-menu")).toBeVisible();

  const moduleChecks = [
    { name: "Finance", pattern: /Finance|Accounts Receivable|Chart of Accounts/i },
    { name: "Reporting", pattern: /Reports|Financial Reports|Scheduled Reports/i },
    { name: "AI Assistant", pattern: /AI Assistant|Smart Assistant/i },
    { name: "Human Resources", pattern: /Human Resources|HR|Attendance/i },
  ];
  const body = await page.locator("body").innerText();
  for (const check of moduleChecks) {
    if (!check.pattern.test(body)) throw new Error(`${check.name} entry was not visible after authentication.`);
  }

  for (const check of moduleChecks) {
    const candidate = page.getByRole("button", { name: check.pattern }).first();
    if (await candidate.count()) {
      await candidate.click();
      await page.waitForTimeout(800);
      const moduleBody = await page.locator("body").innerText();
      if (/cannot access|is not defined|undefined|unavailable|failed to load|error/i.test(moduleBody)) {
        throw new Error(`${check.name} displayed a likely runtime/load error.`);
      }
    }
  }
  if (consoleErrors.length) throw new Error(`Browser errors: ${consoleErrors.join(" | ")}`);
  console.log(JSON.stringify({ target: baseURL, authenticatedAs: email, modules: moduleChecks.map((x) => x.name), status: "passed" }, null, 2));
} finally {
  await browser.close();
}
