import { expect, Page, test } from "@playwright/test";

async function waitForServiceWorker(page: Page) {
  await page.goto("/app?offline-e2e=registration", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    async () => {
      if (!("serviceWorker" in navigator)) return false;
      const registration = await navigator.serviceWorker.getRegistration("/");
      return Boolean(registration?.active);
    },
    undefined,
    { timeout: 15_000 },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => Boolean(navigator.serviceWorker.controller),
    undefined,
    { timeout: 15_000 },
  );
}

test.describe("PWA offline fallback", () => {
  test("registers the production service worker and does not cache API endpoints", async ({ page }) => {
    await waitForServiceWorker(page);

    const cacheSnapshot = await page.evaluate(async () => {
      const keys = await caches.keys();
      const requests = (await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()))).flat();
      return {
        serviceWorker: Boolean(navigator.serviceWorker.controller || (await navigator.serviceWorker.getRegistration("/"))?.active),
        cacheNames: keys,
        cachedUrls: requests.map((request) => request.url),
      };
    });

    expect(cacheSnapshot.serviceWorker).toBe(true);
    expect(cacheSnapshot.cacheNames.some((name) => name.startsWith("smart-manager-shell-"))).toBe(true);
    expect(cacheSnapshot.cachedUrls.some((url) => new URL(url).pathname.startsWith("/api/"))).toBe(false);
  });

  test("serves the branded fallback for a failed navigation and keeps retry available", async ({ page, context }) => {
    await waitForServiceWorker(page);
    await page.goto("/offline.html", { waitUntil: "domcontentloaded" });
    await context.setOffline(true);

    await page.goto("/app?offline-e2e=navigation", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle("Smart Manager — Offline");
    await expect(page.getByRole("heading", { name: "You’re offline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { name: "You’re offline" })).toBeVisible();
  });

  test("does not satisfy API reads or mutations from the offline page", async ({ page, context }) => {
    await waitForServiceWorker(page);
    await context.setOffline(true);

    const results = await page.evaluate(async () => {
      const attempt = async (method: string) => {
        try {
          await fetch("/api/config/public", { method, body: method === "POST" ? "{}" : undefined });
          return "resolved";
        } catch {
          return "rejected";
        }
      };
      return { get: await attempt("GET"), post: await attempt("POST") };
    });

    expect(results).toEqual({ get: "rejected", post: "rejected" });
  });

  test("reloads after connectivity returns", async ({ page, context }) => {
    await waitForServiceWorker(page);
    await page.goto("/offline.html", { waitUntil: "domcontentloaded" });
    await context.setOffline(true);
    await page.goto("/app?offline-e2e=recovery", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "You’re offline" })).toBeVisible();

    await context.setOffline(false);
    const reload = page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await reload;
    await expect(page).toHaveTitle("Smart Manager — Offline");
  });
});
