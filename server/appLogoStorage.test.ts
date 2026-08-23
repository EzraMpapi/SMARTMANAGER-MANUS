import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type ProjectConfig = {
  secrets?: Record<string, string>;
};

describe("managed application logo configuration", () => {
  it("uses a managed-storage path that the local application can serve", async () => {
    const config = JSON.parse(readFileSync(".project-config.json", "utf8")) as ProjectConfig;
    const logoPath = config.secrets?.VITE_APP_LOGO;

    expect(logoPath).toMatch(/^\/manus-storage\/smart-manager-logo_[a-z0-9]+\.png$/);

    const response = await fetch(`http://127.0.0.1:3000${logoPath}`);
    expect(response.ok).toBe(true);
    expect(response.headers.get("content-type")).toMatch(/^image\/png/);

    const brandLogoComponent = readFileSync("client/src/components/BrandLogo.tsx", "utf8");
    const documentShell = readFileSync("client/index.html", "utf8");
    expect(brandLogoComponent).toContain('"/manus-storage/smart-manager-logo_ad2a1e4d.png"');
    expect(brandLogoComponent).toContain('"/manus-storage/smart-manager-mark_aa277576.png"');
    expect(documentShell).not.toContain("/brand/smart-manager-logo.png");
  });
});
