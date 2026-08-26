import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("Collaboration Hub Live Email Template Preview", () => {
  it("includes live email preview toggle and rendered message body viewer", () => {
    expect(dashboardSource).toContain("showEmailPreview");
    expect(dashboardSource).toContain("Live Preview");
    expect(dashboardSource).toContain("Message Body (Live Rendered)");
    expect(dashboardSource).toContain("mergeTemplate");
  });
});
