import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("isolated browser-test build script", () => {
  it("builds in e2e mode with no Supabase configuration and the current Vite default minifier", () => {
    const script = packageJson.scripts?.["pretest:browser"] || "";
    expect(script).toContain("VITE_SUPABASE_URL=");
    expect(script).toContain("VITE_SUPABASE_ANON_KEY=");
    expect(script).toContain("SUPABASE_URL=");
    expect(script).toContain("SUPABASE_ANON_KEY=");
    expect(script).not.toContain("supabase.invalid");
    expect(script).toContain("vite build --mode e2e --sourcemap=false");
    expect(script).not.toContain("--minify=esbuild");
  });
});
