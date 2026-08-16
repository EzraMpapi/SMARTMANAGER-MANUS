import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const documentHead = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");
const manifest = readFileSync(new URL("../client/public/manifest.webmanifest", import.meta.url), "utf8");
const packagingGuide = readFileSync(new URL("../ANDROID_TWA_PACKAGING.md", import.meta.url), "utf8");

describe("Android Trusted Web Activity delivery path", () => {
  it("exposes a production PWA manifest from the Smart Manager document head", () => {
    expect(documentHead).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(documentHead).toContain('name="theme-color" content="#101828"');
    expect(manifest).toContain('"name": "Smart Manager — Enterprise ERP"');
    expect(manifest).toContain('"display": "standalone"');
    expect(manifest).toContain('"purpose": "any"');
  });

  it("documents Bubblewrap builds while keeping the release signing fingerprint out of the public site", () => {
    expect(packagingGuide).toContain("@bubblewrap/cli init");
    expect(packagingGuide).toContain("bubblewrap build");
    expect(packagingGuide).toContain("tz.smartmanager.erp");
    expect(packagingGuide).toContain("REPLACE_WITH_RELEASE_SHA256_FINGERPRINT");
  });
});
