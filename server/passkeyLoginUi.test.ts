import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const authView = readFileSync(new URL("../client/src/components/EnterpriseAuthViews.jsx", import.meta.url), "utf8");
const gateway = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");

describe("passkey login UI", () => {
  it("offers the passkey action alongside established login methods without replacing them", () => {
    expect(authView).toContain("onPasskey");
    expect(authView).toContain("Sign in with a passkey");
    expect(authView).toContain("onOAuth");
    expect(authView).toContain("onSignIn");
  });

  it("persists only a confirmed native-passkey session through the existing login handoff", () => {
    expect(gateway).toContain("signInWithAccountPasskey");
    expect(gateway).toContain("await auth.adoptSession({ access_token: result.access_token, refresh_token: result.refresh_token })");
    expect(gateway).toContain("window.location.assign(withoutAuthView())");
  });
});
