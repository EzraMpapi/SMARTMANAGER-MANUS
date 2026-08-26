import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/ExecutiveCommandCenter.jsx"), "utf8");

describe("premium dashboard header", () => {
  it("uses an explicit real-data performance window instead of an inferred timeframe", () => {
    expect(source).toContain("const PERFORMANCE_WINDOWS");
    expect(source).toContain('const [performanceWindowId, setPerformanceWindowId] = useState("30d")');
    expect(source).toContain('aria-label="Select dashboard performance period"');
    expect(source).toContain("isInPerformanceWindow(row, performanceBounds.start, performanceBounds.end)");
  });

  it("keeps dashboard customization connected to the parent preference flow", () => {
    expect(source).toContain("onCustomizeDashboard");
    expect(source).toContain("Customize dashboard");
    expect(source).toContain("Good morning");
    expect(source).toContain("confirmed workspace records");
  });
});
