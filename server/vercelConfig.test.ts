import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Vercel static deployment configuration", () => {
  it("routes API requests to the serverless Express entrypoint and serves the Vite browser output", () => {
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8"));

    expect(config.framework).toBe("vite");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toEqual([
      { source: "/api/(.*)", destination: "/api" },
      { source: "/(.*)", destination: "/index.html" },
    ]);
  });
});
