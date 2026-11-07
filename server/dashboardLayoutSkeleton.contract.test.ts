import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const skeleton = readFileSync(resolve(process.cwd(), "client/src/components/DashboardLayoutSkeleton.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");


describe("professional dashboard loading skeleton", () => {
  it("communicates loading state accessibly", () => {
    expect(skeleton).toContain('role="status"');
    expect(skeleton).toContain('aria-busy="true"');
    expect(skeleton).toContain('aria-label="Loading Smart Manager workspace"');
    expect(skeleton).toContain("sr-only");
  });

  it("mirrors the enterprise shell hierarchy instead of showing generic blocks", () => {
    for (const surface of ["SidebarSkeleton", "HeaderSkeleton", "MetricSkeleton", "ChartSkeleton", "ActivitySkeleton", "TableSkeleton"]) {
      expect(skeleton).toContain(`function ${surface}`);
    }
    expect(skeleton).toContain("Loading Smart Manager workspace");
    expect(skeleton).toContain("max-w-[1680px]");
  });

  it("preserves responsive layout behavior across mobile, tablet, and wide screens", () => {
    expect(skeleton).toContain("hidden w-[276px]");
    expect(skeleton).toContain("lg:flex");
    expect(skeleton).toContain("sm:grid-cols-2");
    expect(skeleton).toContain("xl:grid-cols-4");
    expect(skeleton).toContain("xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]");
    expect(skeleton).toContain("sm:flex-none");
  });

  it("uses existing design tokens and avoids data or auth side effects", () => {
    expect(skeleton).toContain("dark:bg-slate-950");
    expect(skeleton).toContain("border-slate-200/80");
    expect(skeleton).not.toContain("localStorage");
    expect(skeleton).not.toContain("fetch(");
    expect(skeleton).not.toContain("supabase");
  });

  it("provides a calm theme-aware shimmer with a reduced-motion fallback", () => {
    expect(skeleton).toContain("dashboard-layout-skeleton");
    expect(styles).toContain("dashboard-skeleton-shimmer");
    expect(styles).toContain('[data-theme-period="night"] .dashboard-layout-skeleton');
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("animation: none !important");
  });
});
