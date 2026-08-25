import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(__dirname, "..");
const brandLogoSource = fs.readFileSync(path.join(repositoryRoot, "client/src/components/BrandLogo.tsx"), "utf8");

describe("Smart Manager branding assets", () => {
  it("uses the public full logo route and managed compact mark path", () => {
    expect(brandLogoSource).toContain('SMART_MANAGER_LOGO_URL = "/brand/smart-manager-logo.png"');
    expect(brandLogoSource).toContain('SMART_MANAGER_MARK_URL = "/manus-storage/smart-manager-mark_aa277576.png"');
    expect(brandLogoSource).toContain('variant === "compact" ? SMART_MANAGER_MARK_URL : SMART_MANAGER_LOGO_URL');
  });

  it("does not request the missing animation by default", () => {
    expect(brandLogoSource).toContain("animated = false");
  });
});
