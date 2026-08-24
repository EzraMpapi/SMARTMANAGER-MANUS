import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("managed application logo configuration", () => {
  it("uses the managed-storage path in the runtime branding surfaces", () => {
    const manifest = readFileSync("MANAGED_ASSET_MANIFEST.md", "utf8");
    const brandLogoComponent = readFileSync("client/src/components/BrandLogo.tsx", "utf8");
    const documentShell = readFileSync("client/index.html", "utf8");
    const logoPath = "/manus-storage/smart-manager-logo_ad2a1e4d.png";
    const markPath = "/manus-storage/smart-manager-mark_aa277576.png";

    expect(manifest).toContain(logoPath);
    expect(manifest).toContain(markPath);
    expect(brandLogoComponent).toContain(`SMART_MANAGER_LOGO_URL = "${logoPath}"`);
    expect(brandLogoComponent).toContain(`SMART_MANAGER_MARK_URL = "${markPath}"`);
    expect(documentShell).toContain(`og:image\" content=\"${logoPath}`);
    expect(documentShell).not.toContain("/brand/smart-manager-logo.png");
  });
});
