import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("Collaboration Hub Branded Signatures, PDF Previews & Rich-Text Styling", () => {
  it("includes tenant-branded signature banner elements in email live preview", () => {
    expect(dashboardSource).toContain("Tenant Branded Signature Banner");
    expect(dashboardSource).toContain("Verified East African Commercial Workspace");
  });

  it("includes local PDF attachment simulation and preview rendering", () => {
    expect(dashboardSource).toContain("emailAttachments");
    expect(dashboardSource).toContain("Attached Documents");
    expect(dashboardSource).toContain("Attach PDF / Document");
  });

  it("includes rich-text helper buttons in the email body editor toolbar", () => {
    expect(dashboardSource).toContain("**Bold Text**");
    expect(dashboardSource).toContain("*Italic Text*");
    expect(dashboardSource).toContain("Bullet List");
  });
});
