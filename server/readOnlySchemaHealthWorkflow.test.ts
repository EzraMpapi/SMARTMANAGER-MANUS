import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("read-only schema health workflow", () => {
  it("runs daily with a dedicated read-only secret and reports an incident only on failure", () => {
    const workflow = fs.readFileSync(
      path.resolve(
        process.cwd(),
        ".github/workflows/read-only-schema-health.yml"
      ),
      "utf8"
    );

    expect(workflow).toContain('cron: "0 5 * * *"');
    expect(workflow).toContain("SUPABASE_SCHEMA_HEALTH_DATABASE_URL");
    expect(workflow).toContain("Verify Supabase schema health without writes");
    expect(workflow).toContain("Create or update schema health incident");
    expect(workflow).toContain("if: failure()");
    expect(workflow).toContain("issues: write");
    expect(workflow).toContain(
      "[monitoring] Supabase schema health check failed"
    );
    expect(workflow).toContain("github.rest.issues.listForRepo");
    expect(workflow).toContain("github.rest.issues.create");
    expect(workflow).toContain("github.rest.issues.createComment");
    expect(workflow).toContain("This workflow is inspection-only");
    expect(workflow).not.toContain("INSERT INTO");
    expect(workflow).not.toContain("UPDATE ");
    expect(workflow).not.toContain("DELETE FROM");
  });
});
