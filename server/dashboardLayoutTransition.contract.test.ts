import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const layout = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayout.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("dashboard skeleton-to-content transition", () => {
  it("mounts the authenticated shell behind a dedicated enter boundary", () => {
    expect(layout).toContain('className="dashboard-shell-enter"');
    expect(layout).toContain("<DashboardLayoutSkeleton />");
    expect(layout).toContain("<DashboardLayoutContent");
  });

  it("uses a short opacity/transform transition rather than layout animation", () => {
    expect(styles).toContain("dashboard-shell-enter");
    expect(styles).toContain("animation: dashboard-shell-enter 260ms");
    expect(styles).toContain("opacity: 0; transform: translate3d(0, 8px, 0);");
    expect(styles).toContain("opacity: 1; transform: translate3d(0, 0, 0);");
    expect(styles).toContain("will-change: opacity, transform;");
    expect(styles).not.toContain("dashboard-shell-enter { height:");
    expect(styles).not.toContain("dashboard-shell-enter { width:");
  });

  it("respects reduced-motion preferences and leaves the shell visible", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain(".dashboard-shell-enter");
    expect(styles).toContain("animation: none;");
    expect(styles).toContain("opacity: 1;");
    expect(styles).toContain("transform: none;");
  });
});
