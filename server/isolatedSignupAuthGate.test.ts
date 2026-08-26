import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");

describe("isolated signup route gate", () => {
  it("allows the disposable e2e signup surface before auth recovery states without changing normal routes", () => {
    const isolatedRoute = 'if (requestedSignup && import.meta.env.MODE === "e2e")';
    expect(appSource).toContain(isolatedRoute);
    expect(appSource.indexOf(isolatedRoute)).toBeLessThan(appSource.indexOf('if (auth.loading)'));
    expect(appSource).toContain('if (auth.status === "AUTH_ERROR")');
    expect(appSource).toContain('if (authScreen === "forgot" || authScreen === "reset" || (isPublicAuthScreen() && !auth.isAuthenticated))');
  });
});
