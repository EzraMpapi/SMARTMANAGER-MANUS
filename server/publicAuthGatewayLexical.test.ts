import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gatewaySource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");
const publicConfigSource = readFileSync(new URL("../client/src/lib/publicSupabaseConfig.ts", import.meta.url), "utf8");

describe("PublicAuthGateway Lexical Initialization Safety", () => {
  it("imports React hooks correctly to prevent lexical declaration errors", () => {
    expect(gatewaySource).toContain('import { useEffect, useState } from "react";');
    expect(gatewaySource).toContain("export default function PublicAuthGateway()");
    expect(gatewaySource).toContain("onPasskey={signInWithPasskey}");
    expect(gatewaySource).toContain("onForgot={() => navigate(\"forgot\")}");
    expect(gatewaySource).toContain("onSignup={() => {");
    expect(gatewaySource).toContain("initialError={oauthError}");
    expect(gatewaySource).toContain("onRequest={async (workEmail) => {");
    expect(gatewaySource).toContain("onUpdate={async (_token, newPassword) => {");
    expect(gatewaySource).not.toContain("onSignInWithPasskey=");
    expect(gatewaySource).not.toContain("onForgotPassword=");
    expect(gatewaySource).not.toContain("onSignUp=");
    expect(gatewaySource).not.toContain("onSubmit={async (newPassword) => {");
    expect(gatewaySource).toContain("useAuthContext");
    expect(gatewaySource).toContain("auth.publicConfig");
    expect(gatewaySource).not.toContain("loadPublicSupabaseConfig");
    expect(gatewaySource).not.toContain("getBuildPublicSupabaseConfig");
    expect(publicConfigSource).toContain("/api/config/public");
    expect(publicConfigSource).not.toContain("SUPABASE_SECRET_KEY");
  });
});
