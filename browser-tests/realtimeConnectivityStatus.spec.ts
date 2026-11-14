import { expect, test } from "@playwright/test";
import { installIsolatedDashboardSession } from "./support/isolatedDashboardSession";

async function installFakeRealtimeSocket(page: Parameters<typeof test>[0]["page"]) {
  await page.addInitScript(() => {
    class FakeRealtimeWebSocket {
      static OPEN = 1;
      readyState = 0;
      onopen: ((event: Event) => void) | null = null;
      onclose: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      constructor() {
        setTimeout(() => {
          this.readyState = FakeRealtimeWebSocket.OPEN;
          this.onopen?.(new Event("open"));
        }, 10);
      }
      send() {}
      close() {
        this.readyState = 3;
        this.onclose?.(new Event("close"));
      }
    }
    Object.defineProperty(window, "WebSocket", { configurable: true, writable: true, value: FakeRealtimeWebSocket });
  });
}

test.describe("real-time connectivity header status", () => {
  test("shows live WebSocket state and updates to offline pending outbox state", async ({ page, context }) => {
    await installFakeRealtimeSocket(page);
    await installIsolatedDashboardSession(page);
    await page.route("**/rest/v1/rpc/create_company_and_owner", async (route) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "connectivity-company", name: "Connectivity Status E2E Company", category: "general", country: "Tanzania", currency: "TZS", timezone: "Africa/Dar_es_Salaam" }),
    }));
    await page.goto("/app", { waitUntil: "domcontentloaded" });

    const createCompany = page.getByRole("button", { name: "Create a company", exact: true });
    const companyName = page.getByPlaceholder("e.g. Kilimanjaro Traders Ltd");
    if (await createCompany.isVisible().catch(() => false)) {
      await createCompany.click();
      await companyName.fill("Connectivity Status E2E Company");
      await page.getByRole("button", { name: /Continue to modules/i }).click();
      await page.getByRole("button", { name: /Launch Smart Manager/i }).click();
      const continueToSignIn = page.getByRole("button", { name: /Continue to sign in/i });
      if (await continueToSignIn.isVisible().catch(() => false)) await continueToSignIn.click();
    }

    await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), Layout/ }).first()).toBeVisible();
    const indicator = page.getByTestId("realtime-connectivity-indicator");
    await expect(indicator).toBeVisible();
    await expect(indicator).toContainText("Live");
    await expect(indicator).toContainText("0 pending");

    await page.waitForFunction(() => Boolean((window as any).__SMART_MANAGER_OFFLINE_TEST__));
    await context.setOffline(true);
    const queued = await page.evaluate(async () => {
      const bridge = (window as any).__SMART_MANAGER_OFFLINE_TEST__;
      await bridge.queue("inventory_items", { sku: "CONNECTIVITY-001", name: "Connectivity pending item", qty_on_hand: 2 });
      await bridge.queue("inventory_items", { sku: "CONNECTIVITY-002", name: "Connectivity pending item two", qty_on_hand: 3 });
      return bridge.summary();
    });
    expect(queued.pending).toBe(2);

    await expect(indicator).toContainText("Offline");
    await expect(indicator).toContainText("2 pending");
    await expect(indicator).toHaveAttribute("aria-label", /Offline.*2 pending outbox changes/);
  });
});
