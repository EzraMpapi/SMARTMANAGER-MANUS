import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("support module health contract", () => {
  it("does not present the persisted support workspace as unavailable", () => {
    expect(source).toContain('id: "support", label: "Customer Support", icon: Headphones, status: "available"');
    expect(source).toContain('metric: "Confirmed support workspace"');
    expect(source).not.toContain('id: "support", label: "Customer Support", icon: Headphones, status: "unavailable"');
  });
});
