import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const staticSource = fs.readFileSync(path.resolve(process.cwd(), "server/_core/static.ts"), "utf8");
const viteSource = fs.readFileSync(path.resolve(process.cwd(), "server/_core/vite.ts"), "utf8");
const bootstrapSource = fs.readFileSync(path.resolve(process.cwd(), "server/_core/index.ts"), "utf8");

describe("production HTML cache control", () => {
  it("prevents an obsolete Vite entry document from pinning clients to prior asset hashes", () => {
    expect(staticSource).toContain('filePath.endsWith(".html")');
    expect(staticSource).toContain('res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate")');
    expect(staticSource).toContain('res.sendFile(path.resolve(distPath, "index.html"));');
  });

  it("keeps the production bootstrap independent from development-only Vite imports", () => {
    expect(bootstrapSource).toContain('import { serveStatic } from "./static";');
    expect(viteSource).toContain('import("vite")');
    expect(viteSource).toContain('import("../../vite.config")');
    expect(staticSource).not.toContain('from "vite"');
    expect(staticSource).not.toContain('from "../../vite.config"');
  });
});
