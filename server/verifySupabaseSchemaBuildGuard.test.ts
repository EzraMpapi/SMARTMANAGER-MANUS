import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const verifier = fs.readFileSync(path.resolve(process.cwd(), "server/verifySupabaseSchema.mjs"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("external deployment schema verification guard", () => {
  it("skips only the Vercel build-time schema request when its server-only credential is unavailable", () => {
    expect(verifier).toContain('process.env.VERCEL === "1"');
    expect(verifier).toContain("Vercel build has no server-only Supabase schema credential");
    expect(verifier).toContain("Supabase schema verification requires SUPABASE_URL");
  });

  it("supports the existing external public-key spelling without removing the preferred Vite variable", () => {
    expect(dashboard).toContain("import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.ITE_SUPABASE_ANON_KEY");
  });
});
