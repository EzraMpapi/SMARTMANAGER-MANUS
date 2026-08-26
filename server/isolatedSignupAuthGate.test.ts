import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");

describe("isolated signup route gate", () => {
  it("shows signup only after auth hydration when no authenticated session exists", () => {
    const authenticatedAwareRoute = 'if (requestedSignup && !auth.isAuthenticated)';
    expect(appSource).toContain(authenticatedAwareRoute);
    expect(appSource.indexOf('if (auth.loading)')).toBeLessThan(appSource.indexOf(authenticatedAwareRoute));
    expect(appSource).toContain('if (auth.status === "AUTH_ERROR")');
    expect(appSource).toContain('if (authScreen === "forgot" || authScreen === "reset" || (isPublicAuthScreen() && !auth.isAuthenticated))');
  });
});
