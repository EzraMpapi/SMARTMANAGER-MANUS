import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const migration = fs.readFileSync(
  path.resolve(process.cwd(), "supabase/migrations/20260817_012_support_policy_authenticated_roles.sql"),
  "utf8",
);

describe("support policy authenticated-role migration", () => {
  it("narrows the support configuration policy targets without removing tenant enforcement", () => {
    const policies = [
      "support_teams_tenant ON public.support_teams",
      "support_agents_tenant ON public.support_agents",
      "support_team_members_tenant ON public.support_team_members",
      "support_ticket_notes_tenant ON public.support_ticket_notes",
      "support_ticket_activity_tenant ON public.support_ticket_activity",
      "support_sla_policies_tenant ON public.support_sla_policies",
      "support_message_templates_tenant ON public.support_message_templates",
    ];

    expect(migration).toContain("ALTER POLICY");
    expect(migration).toContain("TO authenticated");
    for (const policy of policies) {
      expect(migration).toContain(policy);
    }
    expect(migration).toContain("current_company_id()");
  });
});
