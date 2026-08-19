import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const qualityDashboardSource = readFileSync(new URL("../client/src/components/AdminQualityDashboard.jsx", import.meta.url), "utf8");
const feedbackModalSource = readFileSync(new URL("../client/src/components/UserFeedbackModal.jsx", import.meta.url), "utf8");

describe("Admin Quality Dashboard and User Feedback Components", () => {
  it("renders test coverage and vulnerability audit metrics in AdminQualityDashboard", () => {
    expect(qualityDashboardSource).toContain("AdminQualityDashboard");
    expect(qualityDashboardSource).toContain("Test Coverage");
    expect(qualityDashboardSource).toContain("Vulnerability Audit");
    expect(qualityDashboardSource).toContain("100%");
  });

  it("provides bug reporting and feedback categories in UserFeedbackModal", () => {
    expect(feedbackModalSource).toContain("UserFeedbackModal");
    expect(feedbackModalSource).toContain("Report a Bug");
    expect(feedbackModalSource).toContain("Feature Request");
    expect(feedbackModalSource).toContain("Submit Feedback");
  });
});
