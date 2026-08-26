import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("AI-assisted mutation boundary", () => {
  it("keeps the legacy client-side executor disabled so recommendations cannot mutate business records directly", () => {
    expect(source).toContain("const directExecutionDisabled = true");
    expect(source).toContain("requires a submitted and authorized AI approval. No business record was changed.");
  });

  it("retains server-verified approval procedures as the active AI mutation contract", () => {
    expect(source).toContain("trpc.ai.requestActionApproval");
    expect(source).toContain("trpc.ai.decideActionApproval");
  });
});
