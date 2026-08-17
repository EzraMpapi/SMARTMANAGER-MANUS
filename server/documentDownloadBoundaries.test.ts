import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("document download boundaries", () => {
  it("uses a predictable suggested filename while retaining browser control over the destination", () => {
    expect(source).toContain("function buildBrowserDownloadFilename(category, reference, extension)");
    expect(source).toContain("smart-manager-${safeCategory}-${safeReference}-${TODAY.toISOString().slice(0, 10)}.${safeExtension}");
    expect(source).toContain("Browser download requested: ${suggestedFilename}. Your browser controls the save location.");
    expect(source).toContain("Your browser or printer controls the save location.");
  });

  it("does not introduce a false local-download-folder, browser-cache, or automatic-file-storage path", () => {
    expect(source).not.toContain("SmartManagerStorage");
    expect(source).not.toContain("file_directories");
    expect(source).not.toContain("showDirectoryPicker");
    expect(source).not.toContain("File saved to Downloads");
  });
});
