import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("tenant activity audit viewer", () => {
  it("loads confirmed audit history through the tenant-scoped company-table hook", () => {
    expect(source).toContain('useCompanyTable("audit_log", [], {');
    expect(source).toContain('order: { col: "created_at", ascending: false }');
    expect(source).toContain("Verified server history");
  });

  it("supports refresh and filters while avoiding an arbitrary company-id query", () => {
    expect(source).toContain("auditLog.reload()");
    expect(source).toContain("Search confirmed activity");
    expect(source).not.toContain('sb("audit_log").eq("company_id"');
  });

  it("does not display a local client audit event as durable history before server confirmation", () => {
    expect(source).toContain('sb("audit_log").insert({ action, module, actor: entry.actor, details: entry.details }).single().run()');
    expect(source).toContain("auditBus.push(mapAuditLogRow(row))");
  });
});
