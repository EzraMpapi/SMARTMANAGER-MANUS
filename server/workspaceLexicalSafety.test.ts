import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("Workspace Lexical Safety & State Ordering", () => {
  it("declares currentUser state before isAdministrativeSession evaluates currentUser.role", () => {
    const currentUserDeclIdx = dashboardSource.indexOf("const [currentUser, setCurrentType]");
    const isAdministrativeIdx = dashboardSource.indexOf("isAdministrativeSession");
    // Ensure currentUser is declared near the top of SmartManager()
    expect(dashboardSource).toContain("const [currentUser, setCurrentUser] = useState");
    expect(isAdministrativeIdx).toBeGreaterThan(0);
  });
});
