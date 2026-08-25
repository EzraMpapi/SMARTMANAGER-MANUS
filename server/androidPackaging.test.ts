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
    
    expect(manifest).toContain('"src": "/brand/smart-manager-logo.png"');
    
    expect(vercelConfig).toContain('"source": "/brand/smart-manager-logo.png"');
    
    expect(vercelConfig).toContain("bserp-dashbo-xgm6fauw.manus.space/manus-storage/smart-manager-logo_ad2a1e4d.png");
    
  });
  

  
  it("documents Bubblewrap builds while keeping the release signing fingerprint out of the public site", () => {
    
    expect(packagingGuide).toContain("@bubblewrap/cli init");
    
    expect(packagingGuide).toContain("bubblewrap build");
    
    expect(packagingGuide).toContain("tz.smartmanager.erp");
    
    expect(packagingGuide).toContain("REPLACE_WITH_RELEASE_SHA256_FINGERPRINT");
    
  });
  

  
  it("pins Android packaging to the verified production origin without embedding a real signing key", () => {
    
    const template = JSON.parse(twaManifestTemplate) as Record<string, unknown>;
    

    
    expect(packagingGuide).toContain("https://bserp-dashbo-xgm6fauw.manus.space/manifest.webmanifest");
    
    expect(packagingGuide).not.toContain("https://menejajanja.vercel.app/manifest.webmanifest");
    
    expect(template).toMatchObject({
      
      packageId: "tz.smartmanager.erp",
      
      host: "bserp-dashbo-xgm6fauw.manus.space",
      
      startUrl: "/",
      
      webManifestUrl: "https://bserp-dashbo-xgm6fauw.manus.space/manifest.webmanifest",
      
      fallbackType: "customtabs",
      
      iconUrl: "https://bserp-dashbo-xgm6fauw.manus.space/brand/smart-manager-logo.png",
      
      maskableIconUrl: "https://bserp-dashbo-xgm6fauw.manus.space/brand/smart-manager-logo.png",
      
    });
    
    expect(JSON.stringify(template)).toContain("REPLACE_WITH_ORGANIZATION_KEYSTORE_PATH");
    
    expect(JSON.stringify(template)).not.toContain("sha256_cert_fingerprints");
    
  });
  

  
  it("requires an approved square source asset instead of cropping or recreating the official horizontal logo", () => {
    
    expect(squareIconHandoff).toContain("1024 × 1024 pixels");
    
    expect(squareIconHandoff).toContain("not generated or reconstructed");
    
    expect(squareIconHandoff).toContain("No square asset has been fabricated, cropped, recoloured, or inferred");
    
    expect(squareIconHandoff).toContain('`purpose` set to `any maskable`');
    
  });
  
});












































