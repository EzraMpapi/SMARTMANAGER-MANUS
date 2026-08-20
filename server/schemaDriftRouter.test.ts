import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("authenticated schema contract router boundary", () => {
  it("exposes schema assertion only through protectedProcedure", () => {
    const start = routerSource.indexOf("schemaContractAssertion:");
    const boundary = routerSource.slice(start, start + 420);
    expect(boundary).toContain("schemaContractAssertion: protectedProcedure");
    expect(boundary).toContain("assertPayloadContract(input.tableName, input.payload)");
    expect(boundary).toContain("tableName: z.string()");
    expect(boundary).toContain("payload: z.record(z.string(), z.unknown())");
  });

  it("does not expose the contract assertion as an unauthenticated public procedure", () => {
    const start = routerSource.indexOf("schemaContractAssertion:");
    const boundary = routerSource.slice(start, start + 160);
    expect(boundary).not.toContain("publicProcedure");
  });

  it("wires the authenticated critical-row mutation to the real guarded Supabase write helper", () => {
    const start = routerSource.indexOf("persistSupabaseCriticalRow:");
    const boundary = routerSource.slice(start, start + 1_100);
    expect(boundary).toContain("persistSupabaseCriticalRow: protectedProcedure");
    expect(boundary).toContain("z.enum(CRITICAL_SUPABASE_TABLES)");
    expect(boundary).toContain("resolveVerifiedProfile(ctx.req)");
    expect(boundary).toContain("profile.company_id !== input.companyId");
    expect(boundary).toContain("persistSupabaseRow(input.tableName");
  });
});
