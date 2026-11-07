import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

describe("Vite build memory configuration", () => {
  it("disables diagnostic gzip reporting without changing the existing Rollup chunk strategy", () => {
    expect(source).toContain("reportCompressedSize: false");
    expect(source).toContain("manualChunks(id)");
    expect(source).toContain('return "react-runtime"');
  });
});
