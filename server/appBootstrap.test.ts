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

  it("keeps auth route detection safe when browser storage is unavailable", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

    expect(source).toContain("let hasStoredSession = false;");
    expect(source).toContain("window.localStorage.getItem(\"bs_access_token\")");
    expect(source).toContain("window.sessionStorage.getItem(\"bs_session_access_token\")");
    expect(source).toContain("} catch {}\n  return params.get(\"auth\") !== \"signup\" && !hasStoredSession;");
  });
});
