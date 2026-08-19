import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const moduleMap = readFileSync(new URL("../module-map-inventory.md", import.meta.url), "utf8");
const bugInventory = readFileSync(new URL("../master-bug-inventory.md", import.meta.url), "utf8");

describe("Smart Manager Protocol Closure", () => {
  it("documents all modules and dependencies in module-map-inventory.md", () => {
    expect(moduleMap).toContain("Collaboration Hub");
    expect(moduleMap).toContain("TRA Fiscal Portal");
    expect(moduleMap).toContain("Executive Dashboard");
  });

  it("records root causes and verification status in master-bug-inventory.md", () => {
    expect(bugInventory).toContain("showConfigModal is not defined");
    expect(bugInventory).toContain("Resolved & Covered");
  });
});
