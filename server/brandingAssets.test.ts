import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(__dirname, "..");
const brandLogoSource = fs.readFileSync(path.join(repositoryRoot, "client/src/components/BrandLogo.tsx"), "utf8");

describe("Smart Manager branding assets", () => {
  it("bundles the supplied full logo and readable compact mark", () => {
    expect(fs.existsSync(path.join(repositoryRoot, "client/public/brand/smart-manager-logo.png"))).toBe(true);
    expect(fs.existsSync(path.join(repositoryRoot, "client/public/brand/smart-manager-mark.png"))).toBe(true);
    expect(brandLogoSource).toContain('"/brand/smart-manager-logo.png"');
    expect(brandLogoSource).toContain('"/brand/smart-manager-mark.png"');
    expect(brandLogoSource).toContain('variant === "compact" ? SMART_MANAGER_MARK_URL : SMART_MANAGER_LOGO_URL');
  });

  it("does not request the missing animation by default", () => {
    expect(brandLogoSource).toContain('animated = false');
  });
});
