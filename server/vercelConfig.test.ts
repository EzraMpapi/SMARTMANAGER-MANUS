import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Vercel static deployment configuration", () => {
  it("serves the Vite browser output rather than the bundled Express server entrypoint", () => {
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8"));

    expect(config.framework).toBe("vite");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toEqual([{ source: "/(.*)", destination: "/index.html" }]);
  });
});
