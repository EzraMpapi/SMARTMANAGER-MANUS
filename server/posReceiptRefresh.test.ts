import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("POS receipt refresh integrity", () => {
  it("reloads transaction items together with transactions after a confirmed POS mutation", () => {
    expect(source).toContain("await Promise.all([transactionsHook.reload?.(), transactionItemsHook?.reload?.()].filter(Boolean));");
  });

  it("keeps an open receipt synchronized to the refreshed mapped transaction", () => {
    const history = source.slice(source.indexOf("function RegisterHistory"), source.indexOf("// Daily sales", source.indexOf("function RegisterHistory")));
    expect(history).toContain("const refreshed = rows.find((entry) => entry.dbId === selected.dbId);");
    expect(history).toContain("if (refreshed && refreshed !== selected) setSelected(refreshed);");
  });
});
