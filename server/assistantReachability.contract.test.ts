import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");

describe("Business Consultant reachability recovery", () => {
  it("retains the failed question and provides an accessible in-place retry without exposing provider details", () => {
    expect(dashboardSource).toContain("const [assistantError, setAssistantError] = useState(null)");
    expect(dashboardSource).toContain("setAssistantError({ message, question })");
    expect(dashboardSource).toContain('role="alert"');
    expect(dashboardSource).toContain("Try again");
    expect(dashboardSource).toContain("send(assistantError.question)");
  });
});
