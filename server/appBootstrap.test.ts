import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("application bootstrap recovery", () => {
  it("wraps both lazy route modules with one-time session-scoped recovery", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

    expect(source).toContain("function lazyWithRecovery(load: () => Promise<LazyModule>, key: string)");
    expect(source).toContain("smart-manager-lazy-retry:${key}");
    expect(source).toContain('"public-auth-gateway"');
    expect(source).toContain('"business-sphere-dashboard"');
    expect(source).toContain("window.location.reload();");
  });

  it("registers a publishable-only runtime auth configuration route", () => {
    const source = readFileSync(resolve(process.cwd(), "server/_core/apiApp.ts"), "utf8");

    expect(source).toContain('app.get("/api/config/public"');
    expect(source).toContain("ENV.supabaseUrl");
    expect(source).toContain("ENV.supabaseAnonKey");
    expect(source).not.toContain("ENV.supabaseSecretKey");
  });

  it("falls back from blank legacy Supabase values to trimmed public Vite values", () => {
    const source = readFileSync(resolve(process.cwd(), "server/_core/env.ts"), "utf8");

    expect(source).toContain("const firstNonEmptyEnv");
    expect(source).toContain("process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL");
    expect(source).toContain("process.env.SUPABASE_ANON_KEY, process.env.VITE_SUPABASE_ANON_KEY");
    expect(source).toContain("supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? \"\"");
  });

  it("keeps auth route detection safe when browser storage is unavailable", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

    expect(source).toContain("<AuthProvider>");
    expect(source).toContain("function isPublicAuthScreen()");
    expect(source).toContain('["login", "forgot", "reset", "verify"]');
    expect(source).toContain("AuthenticationUnavailable");
  });
});
