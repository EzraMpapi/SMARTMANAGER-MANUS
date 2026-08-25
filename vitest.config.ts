import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    // Unit tests mock the network but still need syntactically valid configuration
    // to exercise verified-session code paths. These values are intentionally non-secret.
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "https://unit-test.supabase.invalid",
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? "unit-test-anon-key",
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ?? "unit-test-service-key",
      BUILT_IN_FORGE_API_URL: process.env.BUILT_IN_FORGE_API_URL ?? "https://unit-test-forge.invalid",
      BUILT_IN_FORGE_API_KEY: process.env.BUILT_IN_FORGE_API_KEY ?? "unit-test-forge-key",
    },
    include: ["server/**/*.test.ts", "server/**/*.spec.ts", "client/src/**/*.test.ts", "client/src/**/*.spec.ts"],
  },
});
