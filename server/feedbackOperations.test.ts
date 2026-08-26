import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { publicFeedbackInput } from "./feedbackOperations";

describe("public feedback contract", () => {
  it("accepts a valid website feedback submission", () => {
    const result = publicFeedbackInput.safeParse({
      category: "feature",
      message: "Please add a better inventory export for monthly reporting.",
      email: "visitor@example.com",
      name: "Visitor",
      pagePath: "/",
      website: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short, unsupported, and malformed submissions", () => {
    expect(publicFeedbackInput.safeParse({ category: "feature", message: "too short" }).success).toBe(false);
    expect(publicFeedbackInput.safeParse({ category: "other", message: "This is a long enough feedback message." }).success).toBe(false);
    expect(publicFeedbackInput.safeParse({ category: "bug", message: "This is a long enough feedback message.", email: "not-an-email" }).success).toBe(false);
  });

  it("keeps the schema additive and service-only at the database boundary", () => {
    const migration = readFileSync(new URL("../supabase/migrations/20260826_001_website_feedback_submissions.sql", import.meta.url), "utf8");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.website_feedback_submissions");
    expect(migration).toContain("ALTER TABLE public.website_feedback_submissions ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON TABLE public.website_feedback_submissions FROM PUBLIC, anon, authenticated");
    expect(migration).not.toContain("CREATE POLICY");
  });
});
