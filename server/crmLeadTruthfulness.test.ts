import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const crm = source.slice(source.indexOf("function CRM("), source.indexOf("function LeadPanel("));
const mapper = source.slice(source.indexOf("export function mapLeadRow("), source.indexOf("export function mapContactRow("));

describe("customer relationship lead truthfulness", () => {
  it("does not invent a lead score when no confirmed scoring source exists", () => {
    expect(mapper).toContain('score: r.score ?? data.score ?? null');
    expect(crm).toContain('score: null');
    expect(crm).toContain('lead.score ?? "—"');
    expect(crm).toContain('title={lead.score === null ? "No confirmed lead score"');
    expect(crm).not.toContain("score: 50");
  });
});
