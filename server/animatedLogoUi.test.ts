import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const brandLogo = readFileSync(new URL("../client/src/components/BrandLogo.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("animated Smart Manager branding", () => {
  it("uses the uploaded animation through the shared BrandLogo component", () => {
    expect(brandLogo).toContain("1000411291_698e34d5.mp4");
    expect(brandLogo).toContain("autoPlay");
    expect(brandLogo).toContain("loop");
    expect(brandLogo).toContain("muted");
    expect(brandLogo).toContain("playsInline");
    expect(brandLogo).toContain("poster={SMART_MANAGER_LOGO_URL}");
    expect(brandLogo).toContain("onError={() => setAnimationFailed(true)}");
  });

  it("keeps the static logo visible for reduced-motion users and failed video loads", () => {
    expect(brandLogo).toContain("sm-animated-logo-fallback");
    expect(styles).toContain(".sm-animated-logo-video");
    expect(styles).toContain("display: none");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("routes legacy BrandMark and app loading fallbacks through BrandLogo", () => {
    expect(dashboard).toContain("function BrandMark");
    expect(dashboard).toContain("return <BrandLogo variant=\"compact\"");
    expect(app).toContain("<BrandLogo variant=\"compact\" priority");
    expect(app).toContain("sm-loading-screen");
    expect(app).toContain("sm-loading-brand__orbit");
    expect(app).toContain("sm-loading-progress");
  });

  it("provides layered motion and a static reduced-motion fallback for loading", () => {
    expect(styles).toContain("@keyframes sm-loading-spin");
    expect(styles).toContain("@keyframes sm-loading-breathe");
    expect(styles).toContain("@keyframes sm-loading-progress");
    expect(styles).toContain(".sm-loading-brand__logo");
    expect(styles).toContain(".sm-loading-progress span { width: 55%; transform: none; }");
  });
});
