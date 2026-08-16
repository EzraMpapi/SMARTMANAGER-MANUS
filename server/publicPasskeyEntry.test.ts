import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const gateway = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");

describe("public passkey entry", () => {
  it("starts the existing native passkey ceremony from a landing-page user action", () => {
    expect(home).toContain("signInWithAccountPasskey");
    expect(home).toContain("persistAuthSession");
    expect(home).toContain("Sign in with a passkey");
    expect(home).toContain('window.location.assign("/app")');
  });

  it("keeps the gateway on the same shared confirmed-session persistence helper", () => {
    expect(gateway).toContain('import { persistAuthSession } from "../lib/authSessionStorage"');
    expect(gateway).toContain("signInWithAccountPasskey");
  });
});
