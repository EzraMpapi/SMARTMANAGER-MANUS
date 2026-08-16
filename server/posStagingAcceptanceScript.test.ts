import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const script = readFileSync(new URL("../scripts/preparePosStagingTransactionAcceptance.mjs", import.meta.url), "utf8");

describe("POS staging transaction acceptance preflight", () => {
  it("requires an explicit staging environment and approved product/shift identifiers", () => {
    expect(script).toContain('environment !== "staging"');
    expect(script).toContain("--test-product");
    expect(script).toContain("--test-shift");
  });

  it("does not automate transactional click paths without a designated operator", () => {
    expect(script).toContain("--approved-staging-write");
    expect(script).toContain("does not click transactional POS controls");
    expect(script).not.toContain('callRpc("complete_pos_sale"');
    expect(script).not.toContain('callRpc("complete_pos_return"');
  });
});
