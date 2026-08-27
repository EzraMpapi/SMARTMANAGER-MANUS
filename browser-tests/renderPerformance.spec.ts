import { expect, test } from "playwright/test";

const productionOrigin = "https://smartmanager-manus-render.onrender.com";

const threshold = (name: string, fallback: number) => {
  const configured = Number(process.env[name]);
  return Number.isFinite(configured) && configured > 0 ? configured : fallback;
};

const thresholds = {
  coldStart: threshold("RENDER_COLD_START_MAX_MS", 60000),
  ttfb: threshold("RENDER_TTFB_MAX_MS", 7500),
  domContentLoaded: threshold("RENDER_DCL_MAX_MS", 15000),
  load: threshold("RENDER_LOAD_MAX_MS", 20000),
  firstContentfulPaint: threshold("RENDER_FCP_MAX_MS", 15000),
  apiResponse: threshold("RENDER_API_RESPONSE_MAX_MS", 10000),
};

const apiTargets = [
  {
    name: "application uptime configuration",
    healthRole: "application-uptime",
    path: "/api/config/public",
    expectedStatuses: [200],
    assertShape: (body: unknown) => {
      expect(body).toEqual(expect.objectContaining({
        url: expect.stringMatching(/^https:\/\/.+/),
        anonKey: expect.any(String),
      }));
    },
  },
  {
    name: "database-backed billing catalog",
    healthRole: "database-connectivity",
    path: "/api/billing/catalog",
    expectedStatuses: [200],
    assertShape: (body: unknown) => {
      expect(body).toEqual(expect.objectContaining({ plans: expect.anything() }));
    },
  },
  {
    name: "protected billing access",
    healthRole: "access-control",
    path: "/api/billing/access",
    expectedStatuses: [401, 403],
    assertShape: () => undefined,
  },
] as const;

function assertRenderTarget() {
  const configured = process.env.E2E_BASE_URL?.trim();
  if (!configured) throw new Error("E2E_BASE_URL must point to the Render production deployment.");

  const url = new URL(configured);
  if (url.origin !== productionOrigin) {
    throw new Error(`Render performance monitor refuses a non-production target: ${url.origin}`);
  }
}

test.beforeAll(() => {
  assertRenderTarget();
});

test.describe("Render production performance monitor", () => {
  test("warms the service within the cold-start budget and keeps the application within browser performance budgets", async ({ page, request }, testInfo) => {
    const warmupStartedAt = performance.now();
    const warmup = await request.get("/api/config/public", { timeout: thresholds.coldStart });
    const warmupDuration = Math.round(performance.now() - warmupStartedAt);

    expect(warmup.status(), "Render public configuration must remain available").toBe(200);
    expect(warmupDuration, `Render cold-start/wake duration exceeded ${thresholds.coldStart}ms`).toBeLessThanOrEqual(thresholds.coldStart);

    await page.goto("/app", { waitUntil: "load", timeout: thresholds.load });
    await expect(page.getByRole("heading", { name: "Welcome back", exact: true })).toBeVisible();

    const navigation = await page.evaluate(() => {
      const timing = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const firstContentfulPaint = performance
        .getEntriesByType("paint")
        .find((entry) => entry.name === "first-contentful-paint")?.startTime ?? null;

      if (!timing) throw new Error("Navigation timing entry is unavailable.");
      return {
        ttfb: Math.round(timing.responseStart),
        domContentLoaded: Math.round(timing.domContentLoadedEventEnd),
        load: Math.round(timing.loadEventEnd),
        firstContentfulPaint: firstContentfulPaint === null ? null : Math.round(firstContentfulPaint),
        transferSize: timing.transferSize,
      };
    });

    const metrics = {
      target: productionOrigin,
      observedAt: new Date().toISOString(),
      warmupDurationMs: warmupDuration,
      ...navigation,
      thresholds,
    };

    await testInfo.attach("render-performance-metrics", {
      body: Buffer.from(`${JSON.stringify(metrics, null, 2)}\n`),
      contentType: "application/json",
    });
    console.log(`RENDER_PERFORMANCE_METRICS=${JSON.stringify(metrics)}`);

    expect(metrics.ttfb, `TTFB exceeded ${thresholds.ttfb}ms`).toBeLessThanOrEqual(thresholds.ttfb);
    expect(metrics.domContentLoaded, `DOM content loaded exceeded ${thresholds.domContentLoaded}ms`).toBeLessThanOrEqual(thresholds.domContentLoaded);
    expect(metrics.load, `Load event exceeded ${thresholds.load}ms`).toBeLessThanOrEqual(thresholds.load);
    if (metrics.firstContentfulPaint !== null) {
      expect(metrics.firstContentfulPaint, `First contentful paint exceeded ${thresholds.firstContentfulPaint}ms`).toBeLessThanOrEqual(thresholds.firstContentfulPaint);
    }
  });

  test("keeps monitored API endpoints available, contract-safe, and within response budgets", async ({ request }, testInfo) => {
    const apiMetrics = [] as Array<{
      name: string;
      healthRole: "application-uptime" | "database-connectivity" | "access-control";
      path: string;
      status: number;
      responseDurationMs: number;
    }>;

    for (const target of apiTargets) {
      const startedAt = performance.now();
      const response = await request.get(target.path, { timeout: thresholds.apiResponse });
      const responseDurationMs = Math.round(performance.now() - startedAt);
      const body = await response.json();

      apiMetrics.push({
        name: target.name,
        healthRole: target.healthRole,
        path: target.path,
        status: response.status(),
        responseDurationMs,
      });
      expect(target.expectedStatuses, `${target.name} returned an unexpected status`).toContain(response.status());
      expect(responseDurationMs, `${target.name} response exceeded ${thresholds.apiResponse}ms`).toBeLessThanOrEqual(thresholds.apiResponse);
      target.assertShape(body);
    }

    const metrics = {
      target: productionOrigin,
      observedAt: new Date().toISOString(),
      apiResponseBudgetMs: thresholds.apiResponse,
      applicationUptime: apiMetrics.find((endpoint) => endpoint.healthRole === "application-uptime"),
      databaseHealth: apiMetrics.find((endpoint) => endpoint.healthRole === "database-connectivity"),
      accessControlHealth: apiMetrics.find((endpoint) => endpoint.healthRole === "access-control"),
      endpoints: apiMetrics,
    };

    expect(metrics.applicationUptime, "Application uptime probe must be recorded").toBeDefined();
    expect(metrics.databaseHealth, "Database connectivity probe must be recorded").toBeDefined();
    await testInfo.attach("render-api-performance-metrics", {
      body: Buffer.from(`${JSON.stringify(metrics, null, 2)}\n`),
      contentType: "application/json",
    });
    console.log(`RENDER_API_PERFORMANCE_METRICS=${JSON.stringify(metrics)}`);
  });
});
