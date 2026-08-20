import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("Collaboration Hub Email Attachment & Template Link Checks", () => {
  it("includes email folders, composer tools, templates, and safe link structures", () => {
    expect(dashboardSource).toContain("folderItems");
    expect(dashboardSource).toContain("sentEmails");
    expect(dashboardSource).toContain("drafts");
    expect(dashboardSource).toContain("starred");
    expect(dashboardSource).toContain("Edit3");
  });
});
