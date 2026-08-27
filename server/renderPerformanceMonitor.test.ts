import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Render performance monitor workflow", () => {
  it("measures the active Render production endpoint on a recurring schedule with explicit budgets", () => {
    const workflow = fs.readFileSync(
      path.resolve(process.cwd(), ".github/workflows/render-performance-monitor.yml"),
      "utf8",
    );

    expect(workflow).toContain("name: Render Performance Monitor");
    expect(workflow).toContain('cron: "43 1,7,13,19 * * *"');
    expect(workflow).toContain("E2E_BASE_URL: https://smartmanager-manus-render.onrender.com");
    expect(workflow).toContain('RENDER_COLD_START_MAX_MS: "60000"');
    expect(workflow).toContain('RENDER_TTFB_MAX_MS: "7500"');
    expect(workflow).toContain('RENDER_DCL_MAX_MS: "15000"');
    expect(workflow).toContain('RENDER_LOAD_MAX_MS: "20000"');
    expect(workflow).toContain('RENDER_FCP_MAX_MS: "15000"');
    expect(workflow).toContain('RENDER_API_RESPONSE_MAX_MS: "10000"');
    expect(workflow).toContain("browser-tests/renderPerformance.spec.ts");
    expect(workflow).toContain("Create or update Render performance alert");

    const monitor = fs.readFileSync(
      path.resolve(process.cwd(), "browser-tests/renderPerformance.spec.ts"),
      "utf8",
    );
    expect(monitor).toContain('path: "/api/config/public"');
    expect(monitor).toContain('path: "/api/billing/catalog"');
    expect(monitor).toContain('path: "/api/billing/access"');
    expect(monitor).toContain("RENDER_API_RESPONSE_MAX_MS");
    expect(workflow).not.toContain("vercel.app");
  });
});
