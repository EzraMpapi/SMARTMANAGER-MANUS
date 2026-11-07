import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("application bootstrap recovery", () => {
  it("wraps lazy route modules with GitHub-revision-gated recovery", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

    expect(source).toContain("function lazyWithRecovery(load: () => Promise<LazyModule>, _key: string)");
    expect(source).toContain("reloadIfGithubUpdated");
    expect(source).not.toContain("window.location.reload();");
    expect(source).toContain('"public-auth-gateway"');
    expect(source).toContain('"business-sphere-dashboard"');
  });

  it("only polls for deployed GitHub revisions in production", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
    const updateSource = readFileSync(resolve(process.cwd(), "client/src/lib/githubUpdateReload.ts"), "utf8");

    expect(source).toContain('if (import.meta.env.MODE === "production")');
    expect(source).toContain("startGithubUpdateMonitor();");
    expect(updateSource).toContain('const VERSION_ENDPOINT = "/api/app-version"');
    expect(updateSource).toContain("previousRevision === revision");
    expect(updateSource).toContain("window.location.reload();");
  });

  it("protects School Workspace from stale hashed chunk failures", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

    expect(source).toContain("async function clearStaleShellCaches()");
    expect(source).toContain('cacheKey.startsWith("smart-manager-shell-")');
    expect(source).toContain("beforeReload: clearStaleShellCaches");
    expect(source).toContain('import("./components/SchoolWorkspace")');
    expect(source).toContain(')), "school");');
  });

  it("registers a publishable-only runtime auth configuration route", () => {
    const source = readFileSync(resolve(process.cwd(), "server/_core/apiApp.ts"), "utf8");

    expect(source).toContain('app.get("/api/config/public"');
    expect(source).toContain("ENV.supabaseUrl");
    expect(source).toContain("ENV.supabaseAnonKey");
    expect(source).not.toContain("ENV.supabaseSecretKey");
  });

  it("exposes a cache-free GitHub revision endpoint for update checks", () => {
    const source = readFileSync(resolve(process.cwd(), "server/_core/apiApp.ts"), "utf8");

    expect(source).toContain('app.get("/api/app-version"');
    expect(source).toContain("process.env.GITHUB_SHA");
    expect(source).toContain("process.env.VERCEL_GIT_COMMIT_SHA");
    expect(source).toContain('Cache-Control", "no-store');
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
