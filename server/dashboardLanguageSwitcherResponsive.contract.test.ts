import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("responsive dashboard language switcher", () => {
  it("keeps a native accessible select and a stable test hook", () => {
    expect(source).toContain('data-testid="dashboard-language-switcher"');
    expect(source).toContain('className="dashboard-language-select');
    expect(source).toContain('aria-label={t("language")}');
    expect(source).toContain("onChange={(event) => setLang(event.target.value)}");
  });

  it("uses a compact code-based touch target across tablet widths", () => {
    expect(styles).toContain("@media (min-width: 768px) and (max-width: 1279px)");
    expect(styles).toContain(".dashboard-topbar-language-control {");
    expect(styles).toContain("width: 2.75rem;");
    expect(styles).toContain(".dashboard-language-code {");
    expect(styles).toContain(".dashboard-language-select {");
    expect(styles).toContain("opacity: 0;");
  });

  it("preserves the phone-specific grid placement", () => {
    expect(styles).toContain("grid-template-columns: 3.25rem minmax(0, 1fr) 3.25rem 3.25rem 3.25rem");
    expect(styles).toContain("grid-column: 3;");
    expect(styles).toContain("grid-column: 4;");
    expect(styles).toContain("grid-column: 5;");
  });
});
