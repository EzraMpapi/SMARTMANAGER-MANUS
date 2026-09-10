import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { rowsOf } from "../client/src/lib/rowsOf";

const files = [
  "client/src/BusinessSphereDashboard.jsx",
  "client/src/dashboardExtractedModules.jsx",
  "client/src/components/HealthcareClinicWorkspace.jsx",
  "client/src/components/PredictiveAnalyticsWorkspace.jsx",
];

describe("rows.filter safety", () => {
  it.each([
    [undefined, []],
    [null, []],
    [{}, []],
    [{ rows: undefined }, []],
    [{ rows: null }, []],
    [{ rows: "not-an-array" }, []],
    [{ rows: [{ id: "1" }] }, [{ id: "1" }]],
    [[{ id: "2" }], [{ id: "2" }]],
  ])("normalizes %j without throwing", (source, expected) => {
    expect(rowsOf(source as never)).toEqual(expected);
    expect(() => rowsOf(source as never).filter(() => true)).not.toThrow();
  });

  it("normalizes table rows before filtering", () => {
    for (const relativePath of files) {
      const source = readFileSync(resolve(process.cwd(), relativePath), "utf8");
      expect(source, relativePath).toContain("rowsOf");
      expect(source, relativePath).not.toMatch(/\b[A-Za-z_$][A-Za-z0-9_$]*\.rows\.(filter|map|forEach|find|reduce|some|every|slice|length)\b/);
    }
  });
});
