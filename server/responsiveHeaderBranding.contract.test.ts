import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync("client/src/BusinessSphereDashboard.jsx", "utf8");

describe("responsive topbar branding", () => {
  it("keeps the Smart Manager product logo and name for medium and large screens only", () => {
    expect(source).toContain('className="dashboard-topbar-brand hidden min-w-0 shrink items-center gap-2 md:flex"');
    expect(source).toContain('aria-label="Smart Manager Enterprise Suite"');
  });

  it("keeps the mobile menu control available after branding is hidden", () => {
    expect(source).toContain('aria-label="Open menu"');
    expect(source).toContain("dashboard-topbar-menu-control");
    expect(source).toContain("lg:hidden");
  });
});
