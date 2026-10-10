import fs from "node:fs";
import { describe, expect, it } from "vitest";

const brandLogoSource = fs.readFileSync("client/src/components/BrandLogo.tsx", "utf8");

describe("transparent Smart Manager branding", () => {
  it("does not force a white background behind compact logos", () => {
    expect(brandLogoSource).toContain("bg-transparent");
    expect(brandLogoSource).not.toContain("rounded-[22%] bg-white");
  });

  it("keeps transparency in the canonical uploaded logo asset", () => {
    const png = fs.readFileSync("client/public/brand/smart-manager-logo.png");
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    // PNG color type 6 is RGBA, so the asset can preserve transparent pixels.
    expect(png[25]).toBe(6);
  });
});
