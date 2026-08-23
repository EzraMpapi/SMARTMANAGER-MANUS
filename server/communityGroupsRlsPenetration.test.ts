import { describe, expect, it } from "vitest";

type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;
type RequestResult = { status: number; ok: boolean; body: Json; text: string };

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";
const tenantAToken = process.env.SUPABASE_RLS_TEST_JWT_A ?? "";
const tenantBToken = process.env.SUPABASE_RLS_TEST_JWT_B ?? "";
const groupA = process.env.COMMUNITY_GROUP_RLS_GROUP_A ?? "";
const groupB = process.env.COMMUNITY_GROUP_RLS_GROUP_B ?? "";
const memberA = process.env.COMMUNITY_GROUP_RLS_MEMBER_A ?? "";
const memberB = process.env.COMMUNITY_GROUP_RLS_MEMBER_B ?? "";
const loanB = process.env.COMMUNITY_GROUP_RLS_LOAN_B ?? "";
const auditB = process.env.COMMUNITY_GROUP_RLS_AUDIT_B ?? "";
const runLive = Boolean(supabaseUrl && publishableKey && tenantAToken && tenantBToken && groupA && groupB && memberA && memberB && loanB && auditB);

function jwtSubject(token: string) {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("RLS penetration test token is not a JWT.");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).sub as string;
}

async function request(token: string, path: string, init: RequestInit = {}): Promise<RequestResult> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: Json = null;
  try { body = text ? JSON.parse(text) as Json : null; } catch { body = text; }
  return { status: response.status, ok: response.ok, body, text };
}

async function rpc(token: string, name: string): Promise<Json> {
  const result = await request(token, `rpc/${name}`);
  if (!result.ok) throw new Error(`RPC ${name} failed with ${result.status}: ${result.text}`);
  return result.body;
}

function rows(result: RequestResult): Array<Record<string, unknown>> {
  return Array.isArray(result.body) ? result.body as Array<Record<string, unknown>> : [];
}

function expectDeniedOrEmpty(result: RequestResult, label: string) {
  expect(result.ok ? rows(result) : [], `${label} must not return protected rows`).toHaveLength(0);
}

describe("Community Groups RLS penetration-test gating", () => {
  it("requires two tenant JWTs and isolated fixture IDs before live execution", () => {
    expect(runLive).toBe(Boolean(supabaseUrl && publishableKey && tenantAToken && tenantBToken && groupA && groupB && memberA && memberB && loanB && auditB));
  });
});

describe.skipIf(!runLive)("live Community Groups cross-tenant RLS penetration test", () => {
  it("cannot read tenant B groups or child rows using tenant A credentials", async () => {
    const companyA = await rpc(tenantAToken, "current_company_id");
    const companyB = await rpc(tenantBToken, "current_company_id");
    expect(companyA).not.toBe(companyB);

    const ownGroups = await request(tenantAToken, "community_groups?select=id,company_id&limit=100");
    expect(ownGroups.ok).toBe(true);
    expect(rows(ownGroups).every((row) => row.company_id === companyA)).toBe(true);

    const foreignGroup = await request(tenantAToken, `community_groups?select=id,company_id&id=eq.${encodeURIComponent(groupB)}&limit=1`);
    expectDeniedOrEmpty(foreignGroup, "tenant A foreign group read");

    for (const table of ["community_group_members", "community_group_contributions", "community_group_savings", "community_group_loans", "community_group_audit_log"]) {
      const foreignRows = await request(tenantAToken, `${table}?select=id,company_id&company_id=eq.${encodeURIComponent(String(companyB))}&limit=10`);
      expectDeniedOrEmpty(foreignRows, `tenant A ${table} cross-tenant read`);
    }
  });

  it("rejects cross-tenant inserts and relationship forgery", async () => {
    const companyA = await rpc(tenantAToken, "current_company_id");
    const forgedGroup = await request(tenantAToken, "community_group_members", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ company_id: companyA, group_id: groupB, full_name: "RLS penetration fixture", national_id: `RLS-${Date.now()}` }),
    });
    expect(forgedGroup.ok).toBe(false);

    const forgedContribution = await request(tenantAToken, "community_group_contributions", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ company_id: companyA, group_id: groupB, member_id: memberA, amount: 1, contribution_type: "Contribution" }),
    });
    expect(forgedContribution.ok).toBe(false);

    const forgedLoan = await request(tenantAToken, "community_group_loans", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ company_id: companyA, group_id: groupB, member_id: memberA, principal: 1, term_months: 1 }),
    });
    expect(forgedLoan.ok).toBe(false);
  });

  it("rejects cross-tenant updates and deletes, including direct company_id tampering", async () => {
    const companyA = await rpc(tenantAToken, "current_company_id");
    const update = await request(tenantAToken, `community_groups?id=eq.${encodeURIComponent(groupB)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ name: "Cross-tenant overwrite", company_id: companyA }),
    });
    expectDeniedOrEmpty(update, "tenant A foreign group update");

    const deleteResult = await request(tenantAToken, `community_groups?id=eq.${encodeURIComponent(groupB)}`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });
    expectDeniedOrEmpty(deleteResult, "tenant A foreign group delete");

    const loanUpdate = await request(tenantAToken, `community_group_loans?id=eq.${encodeURIComponent(loanB)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ status: "Disbursed", company_id: companyA }),
    });
    expectDeniedOrEmpty(loanUpdate, "tenant A foreign loan state transition");
  });

  it("rejects forged audit actors and audit history mutation", async () => {
    const subjectA = jwtSubject(tenantAToken);
    const companyA = await rpc(tenantAToken, "current_company_id");
    const forgedInsert = await request(tenantAToken, "community_group_audit_log", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ company_id: companyA, group_id: groupA, actor_id: jwtSubject(tenantBToken), actor_name: "Tenant B administrator", action: "FORGED", entity_type: "SecurityTest", details: { penetrationTest: true } }),
    });
    if (forgedInsert.ok) {
      const inserted = rows(forgedInsert);
      expect(inserted).toHaveLength(1);
      expect(inserted[0].actor_id).toBe(subjectA);
      expect(inserted[0].actor_name).not.toBe("Tenant B administrator");
    } else expect(forgedInsert.status).toBeGreaterThanOrEqual(400);

    const update = await request(tenantAToken, `community_group_audit_log?id=eq.${encodeURIComponent(auditB)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ action: "Tampered" }),
    });
    expectDeniedOrEmpty(update, "audit update");

    const deletion = await request(tenantAToken, `community_group_audit_log?id=eq.${encodeURIComponent(auditB)}`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });
    expectDeniedOrEmpty(deletion, "audit delete");
  });

  it("does not allow a non-privileged tenant user to approve or disburse tenant B loans", async () => {
    const result = await request(tenantAToken, `community_group_loans?id=eq.${encodeURIComponent(loanB)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ approval_status: "Approved", status: "Disbursed" }),
    });
    expectDeniedOrEmpty(result, "non-privileged approval/disbursement attempt");
  });
});
