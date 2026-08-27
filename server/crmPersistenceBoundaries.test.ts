import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");
const customer360 = source.slice(source.indexOf("function Customer360View("), source.indexOf("const CRM_TABS"));
const crm = source.slice(source.indexOf("function CRM("), source.indexOf("function LeadPanel("));
const leadForm = source.slice(source.indexOf("function LeadFormPanel("), source.indexOf("/* ------------------------------- OPPORTUNITIES"));

describe("CRM persistence boundaries", () => {
  it("maps customer interactions from the generic data envelope", () => {
    expect(customer360).toContain('const data = r.data && typeof r.data === "object" ? r.data : {};');
    expect(customer360).toContain('customer: r.customer_name || data.customer_name || r.customer || data.customer || ""');
    expect(customer360).toContain('date: r.occurred_at || data.occurred_at || r.created_at || null');
  });

  it("does not show an interaction as logged until Supabase confirms the write", () => {
    const insertAt = customer360.indexOf('await sb("crm_interactions").insert');
    const addConfirmedRowAt = customer360.indexOf('interactions.setRows((prev) => [mapInteractionRow(header), ...prev]);');
    expect(insertAt).toBeGreaterThan(-1);
    expect(addConfirmedRowAt).toBeGreaterThan(insertAt);
    expect(customer360).toContain('notify(`${row.channel} interaction saved for ${customer}.`);');
    expect(customer360).not.toContain('Logged locally, but the server update failed.');
  });

  it("keeps lead inputs available while a failed request is retried and blocks duplicate submission", () => {
    expect(leadForm).toContain('const [submitting, setSubmitting] = useState(false);');
    expect(leadForm).toContain('if (!valid || submitting) return;');
    expect(leadForm).toContain('disabled={submitting}');
    expect(leadForm).toContain('{submitting ? "Saving…" : "Create Lead"}');
  });

  it("uses only the returned lead row after a configured-server create succeeds", () => {
    expect(crm).toContain('if (!header?.id) throw buildConfirmedMutationError');
    expect(crm).toContain('setLeads((prev) => [mapLeadRow(header), ...prev]);');
    expect(crm).toContain('return false;');
  });
});
