import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const reconciliation = readFileSync(
  path.join(repoRoot, "docs/smart-manager-book/master-book/evidence/rls_reconciliation_2026-08-24.txt"),
  "utf8",
);
const masterBookReadme = readFileSync(
  path.join(repoRoot, "docs/smart-manager-book/master-book/README.md"),
  "utf8",
);
const complianceReadme = readFileSync(
  path.join(repoRoot, "docs/smart-manager-book/compliance-report/README.md"),
  "utf8",
);
const focusedReport = readFileSync(
  path.join(repoRoot, "docs/smart-manager-book/compliance-report/SMART_MANAGER_COMPLIANCE_REPORT.md"),
  "utf8",
);

const authTablesWithoutRls = [
  "auth.oauth_clients",
  "auth.oauth_authorizations",
  "auth.oauth_consents",
  "auth.oauth_client_states",
  "auth.custom_oauth_providers",
  "auth.webauthn_credentials",
  "auth.webauthn_challenges",
];

describe("RLS schema reconciliation contract", () => {
  it("records zero public RLS gaps and seven internal auth-schema entries", () => {
    expect(reconciliation).toContain("Public schema tables: 519");
    expect(reconciliation).toContain("Public tables with RLS disabled: 0");
    expect(reconciliation).toContain("Auth schema tables with RLS disabled: 7");
    expect(reconciliation).toContain("These auth tables should not be altered with a blanket ALTER TABLE ... ENABLE ROW LEVEL SECURITY migration");

    for (const tableName of authTablesWithoutRls) {
      expect(reconciliation).toContain(tableName);
    }
  });

  it("keeps the public-versus-auth interpretation consistent across published documentation", () => {
    expect(masterBookReadme).toContain("All 519 public application tables reported RLS enabled");
    expect(masterBookReadme).toContain("seven entries without RLS are Supabase-managed auth-schema tables");
    expect(complianceReadme).toContain("All 519 public application tables report RLS enabled");
    expect(complianceReadme).toContain("seven non-RLS entries are Supabase-managed auth-schema tables");
    expect(focusedReport).toContain("| Public RLS enabled | 519 |");
    expect(focusedReport).toContain("| Public RLS disabled | 0 |");
    expect(focusedReport).toContain("| Auth-schema entries without RLS | 7 |");
  });
});
