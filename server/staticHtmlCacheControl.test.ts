import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "server/_core/vite.ts"), "utf8");

describe("production HTML cache control", () => {
  it("prevents an obsolete Vite entry document from pinning clients to prior asset hashes", () => {
    expect(source).toContain('filePath.endsWith(".html")');
    expect(source).toContain('res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate")');
    expect(source).toContain('res.sendFile(path.resolve(distPath, "index.html"));');
  });
});
