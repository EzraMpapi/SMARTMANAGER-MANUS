-- Defense-in-depth follow-up for support workflow tables.
-- Existing policies already constrain every operation with current_company_id().
-- This migration additionally requires an authenticated database role and
-- preserves the policy names and tenant predicates without changing data.

BEGIN;

ALTER POLICY support_teams_tenant ON public.support_teams TO authenticated;
ALTER POLICY support_agents_tenant ON public.support_agents TO authenticated;
ALTER POLICY support_team_members_tenant ON public.support_team_members TO authenticated;
ALTER POLICY support_ticket_notes_tenant ON public.support_ticket_notes TO authenticated;
ALTER POLICY support_ticket_activity_tenant ON public.support_ticket_activity TO authenticated;
ALTER POLICY support_sla_policies_tenant ON public.support_sla_policies TO authenticated;
ALTER POLICY support_message_templates_tenant ON public.support_message_templates TO authenticated;

COMMIT;
