import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Vercel static deployment configuration", () => {
  it("routes API requests to the serverless Express entrypoint and serves the Vite browser output", () => {
    const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8"));

    expect(config.framework).toBe("vite");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toEqual([
      {
        source: "/brand/smart-manager-logo.png",
        destination: "https://bserp-dashbo-xgm6fauw.manus.space/manus-storage/smart-manager-logo_ad2a1e4d.png",
      },
      { source: "/api/(.*)", destination: "/api" },
      { source: "/(.*)", destination: "/index.html" },
    ]);

    const viteConfig = fs.readFileSync(path.resolve(process.cwd(), "vite.config.ts"), "utf8");
    expect(viteConfig).toContain('process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL');
    expect(viteConfig).toContain('process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY');
    expect(viteConfig).not.toContain('SUPABASE_SECRET_KEY": JSON.stringify');
  });
});
