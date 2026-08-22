import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gatewaySource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");

describe("PublicAuthGateway Lexical Initialization Safety", () => {
  it("imports React hooks correctly to prevent lexical declaration errors", () => {
    expect(gatewaySource).toContain("import React, { useState, useEffect } from \"react\"");
    expect(gatewaySource).toContain("export default function PublicAuthGateway()");
    expect(gatewaySource).toContain("onPasskey={signInWithPasskey}");
    expect(gatewaySource).toContain("onForgot={() => navigate(\"forgot\")}");
    expect(gatewaySource).toContain("onSignup={() => {");
    expect(gatewaySource).toContain("initialError={oauthError}");
    expect(gatewaySource).toContain("onRequest={async (workEmail) => {");
    expect(gatewaySource).toContain("onUpdate={async (token, newPassword) => {");
    expect(gatewaySource).not.toContain("onSignInWithPasskey=");
    expect(gatewaySource).not.toContain("onForgotPassword=");
    expect(gatewaySource).not.toContain("onSignUp=");
    expect(gatewaySource).not.toContain("onSubmit={async (newPassword) => {");
  });
});
