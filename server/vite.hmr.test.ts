import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const viteMiddlewareSource = readFileSync(new URL("./_core/vite.ts", import.meta.url), "utf8");

describe("managed preview Vite HMR transport", () => {
  it("keeps HMR on the attached server and targets the browser-facing secure preview port", () => {
    expect(viteMiddlewareSource).toContain("hmr: { server, protocol: \"wss\" as const, clientPort: 443 }");
    expect(viteMiddlewareSource).toContain("...(viteConfig.server ?? {})");
    expect(viteMiddlewareSource).not.toContain("hmr: { server },");
  });
});
