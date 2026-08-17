import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("POS UX Enhancements", () => {
  const dashboardPath = path.resolve("/home/ubuntu/businesssphere-erp/client/src/BusinessSphereDashboard.jsx");
  const source = fs.readFileSync(dashboardPath, "utf-8");

  it("includes offline connection status alert banner with manual force sync button", () => {
    expect(source).toContain("Network connection interrupted");
    expect(source).toContain("Force sync all");
    expect(source).toContain("isOnline");
  });

  it("includes visual busy loading spinner and message indicator during checkout processing", () => {
    expect(source).toContain("Processing transaction...");
    expect(source).toContain("animate-spin");
  });
});
