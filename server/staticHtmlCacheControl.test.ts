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

  it("returns 404 for missing files instead of serving index.html as a module", () => {
    expect(source).toContain("if (path.extname(req.path))");
    expect(source).toContain("res.status(404).end();");
    expect(source).toContain("Fall through to index.html for client-side application routes only.");
  });
});
