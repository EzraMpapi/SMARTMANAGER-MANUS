import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = path.resolve(__dirname, "..");
const brandLogoSource = fs.readFileSync(path.join(repositoryRoot, "client/src/components/BrandLogo.tsx"), "utf8");
const documentHead = fs.readFileSync(path.join(repositoryRoot, "client/index.html"), "utf8");
const manifest = fs.readFileSync(path.join(repositoryRoot, "client/public/manifest.webmanifest"), "utf8");

const logoAssets = [
  "client/public/brand/smart-manager-logo.png",
  "client/public/brand/smart-manager-logo-512.png",
  "client/public/brand/smart-manager-logo-192.png",
  "client/public/brand/smart-manager-logo-180.png",
  "client/public/brand/smart-manager-logo-64.png",
  "client/public/brand/smart-manager-logo-32.png",
];

describe("Smart Manager branding assets", () => {
  it("uses the same local transparent logo route for full and compact variants", () => {
    expect(brandLogoSource).toContain('SMART_MANAGER_LOGO_URL = "/brand/smart-manager-logo.png"');
    expect(brandLogoSource).toContain("SMART_MANAGER_MARK_URL = SMART_MANAGER_LOGO_URL");
    expect(brandLogoSource).toContain('variant === "compact" ? SMART_MANAGER_MARK_URL : SMART_MANAGER_LOGO_URL');
    expect(brandLogoSource).toContain("width={512} height={512}");
  });

  it("ships all declared logo assets as non-empty PNG files", () => {
    for (const relativePath of logoAssets) {
      const filePath = path.join(repositoryRoot, relativePath);
      expect(fs.existsSync(filePath), relativePath).toBe(true);
      expect(fs.statSync(filePath).size, relativePath).toBeGreaterThan(1000);
      expect(fs.readFileSync(filePath).subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
    }
  });

  it("declares optimized favicon, Apple touch, and PWA icon variants", () => {
    expect(documentHead).toContain('sizes="32x32" href="/brand/smart-manager-logo-32.png"');
    expect(documentHead).toContain('sizes="64x64" href="/brand/smart-manager-logo-64.png"');
    expect(documentHead).toContain('sizes="180x180" href="/brand/smart-manager-logo-180.png"');
    expect(manifest).toContain('"src": "/brand/smart-manager-logo-192.png"');
    expect(manifest).toContain('"sizes": "192x192"');
    expect(manifest).toContain('"src": "/brand/smart-manager-logo-512.png"');
    expect(manifest).toContain('"sizes": "512x512"');
    expect(manifest).not.toContain("1536x1024");
  });

  it("does not request the missing animation by default", () => {
    expect(brandLogoSource).toContain("animated = false");
  });
});
