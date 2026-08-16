import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("campaign integrity boundary", () => {
  it("does not fabricate campaign engagement metrics", () => {
    expect(source).not.toContain("35 + Math.floor(Math.random() * 30)");
    expect(source).not.toContain("6 + Math.floor(Math.random() * 12)");
    expect(source).toContain("Campaign delivery is not configured. The campaign remains unchanged.");
  });

  it("updates campaign UI state only after the server confirms create, transition, or deletion", () => {
    expect(source).toContain("The server did not confirm the new campaign.");
    expect(source).toContain("The campaign status could not be saved to the server. The campaign remains unchanged.");
    expect(source).toContain("The campaign could not be deleted from the server. It remains available.");
  });
});
