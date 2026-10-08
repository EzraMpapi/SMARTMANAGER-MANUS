import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const documentHead = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");
const manifest = readFileSync(new URL("../client/public/manifest.webmanifest", import.meta.url), "utf8");
const packagingGuide = readFileSync(new URL("../ANDROID_TWA_PACKAGING.md", import.meta.url), "utf8");
const squareIconHandoff = readFileSync(new URL("../SQUARE_APP_ICON_HANDOFF.md", import.meta.url), "utf8");
const twaManifestTemplate = readFileSync(new URL("../android/twa-manifest.template.json", import.meta.url), "utf8");
const vercelConfig = readFileSync(new URL("../vercel.json", import.meta.url), "utf8");

describe("Android Trusted Web Activity delivery path", () => {
  it("exposes a production PWA manifest from the Smart Manager document head", () => {
    expect(documentHead).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(documentHead).toContain('name="theme-color" content="#101828"');
    expect(manifest).toContain('"name": "Smart Manager — Enterprise ERP"');
    expect(manifest).toContain('"display": "standalone"');
    expect(manifest).toContain('"purpose": "any maskable"');
    expect(manifest).toContain('"src": "/brand/smart-manager-logo-512.png"');
    expect(manifest).toContain('"sizes": "512x512"');
    expect(manifest).toContain('"src": "/brand/smart-manager-logo-192.png"');
    expect(manifest).toContain('"sizes": "192x192"');
    expect(vercelConfig).not.toContain('"source": "/brand/smart-manager-logo.png"');
    expect(vercelConfig).not.toContain("smart-manager-logo_ad2a1e4d.png");
  });

  it("documents Bubblewrap builds while keeping the release signing fingerprint out of the public site", () => {
    expect(packagingGuide).toContain("@bubblewrap/cli init");
    expect(packagingGuide).toContain("bubblewrap build");
    expect(packagingGuide).toContain("tz.smartmanager.erp");
    expect(packagingGuide).toContain("REPLACE_WITH_RELEASE_SHA256_FINGERPRINT");
  });

  it("pins Android packaging to the verified Vercel production origin without embedding a real signing key", () => {
    const template = JSON.parse(twaManifestTemplate) as Record<string, unknown>;

    expect(packagingGuide).toContain("https://menejajanja.vercel.app/manifest.webmanifest");
    expect(packagingGuide).not.toContain("https://bserp-dashbo-xgm6fauw.manus.space/manifest.webmanifest");
    expect(template).toMatchObject({
      packageId: "tz.smartmanager.erp",
      host: "menejajanja.vercel.app",
      startUrl: "/",
      webManifestUrl: "https://menejajanja.vercel.app/manifest.webmanifest",
      fallbackType: "customtabs",
      iconUrl: "https://menejajanja.vercel.app/brand/smart-manager-logo.png",
      maskableIconUrl: "https://menejajanja.vercel.app/brand/smart-manager-logo.png",
    });
    expect(JSON.stringify(template)).toContain("REPLACE_WITH_ORGANIZATION_KEYSTORE_PATH");
    expect(JSON.stringify(template)).not.toContain("sha256_cert_fingerprints");
  });

  it("requires the repository-managed square source asset and documents its release checks", () => {
    expect(squareIconHandoff).toContain("client/public/brand/smart-manager-logo.png");
    expect(squareIconHandoff).toContain("smart-manager-logo-192.png");
    expect(squareIconHandoff).toContain("smart-manager-logo-512.png");
    expect(squareIconHandoff).toContain("real transparent alpha");
    expect(squareIconHandoff).toContain("any maskable");
  });
});
