import { describe, expect, it } from "vitest";
import { decodeLogoBase64, isRecognizedLogo, normalizeBrandColor, normalizeOrganizationIndustryFocus } from "./workspaceBranding";

describe("workspace branding validation", () => {
  it("normalizes valid six-digit hexadecimal colors and rejects malformed input", () => {
    expect(normalizeBrandColor(" #16a34a ")).toBe("#16A34A");
    expect(() => normalizeBrandColor("emerald")).toThrow("valid six-digit brand color");
    expect(() => normalizeBrandColor("#12ABCD99")).toThrow("valid six-digit brand color");
  });

  it("accepts an allowed image payload below the upload limit and rejects non-image payloads", () => {
    const png = decodeLogoBase64({ mimeType: "image/png", base64: Buffer.from("small-logo").toString("base64") });
    expect(png.ext).toBe("png");
    expect(png.bytes.toString()).toBe("small-logo");
    expect(() => decodeLogoBase64({ mimeType: "image/png", base64: "not valid base64!" })).toThrow("PNG, JPEG, WebP, or SVG");
  });

  it("verifies uploaded bytes match the declared image type before storage", () => {
    const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(isRecognizedLogo(pngHeader, "image/png")).toBe(true);
    expect(isRecognizedLogo(Buffer.from("not-an-image"), "image/png")).toBe(false);
    expect(isRecognizedLogo(Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"), "image/svg+xml")).toBe(true);
  });

  it("accepts only the controlled organization industry focus values", () => {
    expect(normalizeOrganizationIndustryFocus("healthcare")).toBe("healthcare");
    expect(normalizeOrganizationIndustryFocus(undefined)).toBeUndefined();
    expect(() => normalizeOrganizationIndustryFocus("untrusted-category")).toThrow("supported organization industry focus");
  });
});
