import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("automatic dashboard shell theme", () => {
  it("uses the local clock for auto mode instead of mixing OS preference into daylight", () => {
    expect(source).toContain('themeMode === "auto"');
    expect(source).toContain("new Date(themeClock).getHours()");
    expect(source).not.toContain("systemDarkMode ||");
    expect(source).toContain('const themePeriod = darkMode ? "night" : "day"');
  });

  it("exposes theme period attributes on the persistent navigation surfaces", () => {
    expect(source).toContain("data-theme-period={themePeriod}");
    expect(source).toContain("data-theme-mode={themeMode}");
  });

  it("keeps day colors and scopes adaptive night colors to topbar/navigation", () => {
    expect(styles).toContain('[data-theme-period="day"] .dashboard-topbar');
    expect(styles).toContain('[data-theme-period="night"] .dashboard-topbar');
    expect(styles).toContain('[data-theme-period="night"] .dashboard-mobile-nav');
    expect(styles).toContain('[data-theme-period="night"] .dashboard-sidebar:not(.dark-shell)');
  });
});
