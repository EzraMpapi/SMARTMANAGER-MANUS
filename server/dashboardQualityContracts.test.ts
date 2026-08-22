import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "client/src");
const files = [
  "components/ExecutiveCommandCenter.jsx",
  "components/CommercialCommandCenters.jsx",
  "components/OperationsCommandCenters.jsx",
  "components/FinanceCommandCenters.jsx",
  "components/PeopleCommandCenters.jsx",
  "components/SectorCommandCenters.jsx",
  "components/VerticalCommandCenters.jsx",
].map((file) => ({ file, text: fs.readFileSync(path.join(root, file), "utf8") }));
const dashboard = fs.readFileSync(path.join(root, "BusinessSphereDashboard.jsx"), "utf8");

describe("dashboard quality and boundary contracts", () => {
  it("keeps every command center responsive and source-labeled", () => {
    for (const { text } of files) {
      expect(text).toContain("grid-cols-1");
      expect(text).toContain("sm:grid-cols-2");
      expect(text).toContain("asRows");
      expect(text).toContain("Source:");
      expect(text).toContain("Insufficient");
      expect(text).toContain("aria-label");
    }
  });

  it("preserves confirmed-data and tenant-boundary conventions", () => {
    expect(dashboard).toContain("useCompanyTable");
    expect(dashboard).toContain("company");
    expect(dashboard).toContain("canManage");
    expect(dashboard).toContain("onNavigate={go}");
    expect(dashboard).toContain("employee-portal");
  });

  it("does not introduce client-side persistence into command-center components", () => {
    for (const { text } of files) {
      expect(text).not.toContain("localStorage");
      expect(text).not.toContain("sessionStorage");
      expect(text).not.toContain("Math.random");
    }
  });
});
