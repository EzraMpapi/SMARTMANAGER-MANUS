import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const verifier = fs.readFileSync(path.resolve(process.cwd(), "server/verifySupabaseSchema.mjs"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");

describe("external deployment schema verification guard", () => {
  it("skips only unavailable, unreachable, or unauthorized server-only schema verification during a Vercel build", () => {
    expect(verifier).toContain('process.env.VERCEL === "1"');
    expect(verifier).toContain("Vercel build has no server-only Supabase schema credential");
    expect(verifier).toContain("Vercel could not reach the server-only Supabase schema endpoint");
    expect(verifier).toContain("Vercel could not authorize the server-only Supabase schema endpoint");
    expect(verifier).toContain("[401, 403].includes(response.status)");
    expect(verifier).toContain("Supabase schema verification requires SUPABASE_URL");
  });

  it("supports the existing external public-key spelling without removing the preferred Vite variable", () => {
    expect(dashboard).toContain("import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.ITE_SUPABASE_ANON_KEY");
  });
});
