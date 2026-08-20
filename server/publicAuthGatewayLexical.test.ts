import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gatewaySource = readFileSync(new URL("../client/src/components/PublicAuthGateway.jsx", import.meta.url), "utf8");

describe("PublicAuthGateway Lexical Initialization Safety", () => {
  it("imports React hooks correctly to prevent lexical declaration errors", () => {
    expect(gatewaySource).toContain("import React, { useState, useEffect, useMemo } from \"react\"");
    expect(gatewaySource).toContain("export default function PublicAuthGateway()");
  });
});
