import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const vatSection = source.slice(source.indexOf("function TaxVATReport"), source.indexOf("function TaxVATReport") + 2200);

describe("VAT report tax-rate configuration", () => {
  it("preserves a configured 0% tax rate instead of coercing it to the default", () => {
    expect(vatSection).toContain("const taxRate = company?.taxRate ?? 18;");
    expect(vatSection).not.toContain("const taxRate = company?.taxRate || 18;");
  });
});
