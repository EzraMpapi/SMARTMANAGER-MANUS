-- Remove anonymous execution from sensitive account/workspace RPCs and
-- unreferenced money-agent calculation helpers. Public SafariTiketi booking
-- functions remain intentionally public and require separate product review.
-- Existing authenticated application paths retain execution where required.
BEGIN;

ALTER FUNCTION public.get_current_profile_identity()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.update_current_profile_identity(jsonb)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.set_current_profile_avatar(text, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.list_my_companies()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.list_workspace_members()
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.switch_current_company(uuid)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.remove_workspace_member(uuid)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.update_workspace_member_role(uuid, text)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.money_agent_fee(uuid, text, numeric)
  SET search_path = pg_catalog, public, auth;
ALTER FUNCTION public.money_agent_commission(uuid, text, numeric)
  SET search_path = pg_catalog, public, auth;

REVOKE ALL ON FUNCTION public.get_current_profile_identity() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_current_profile_identity(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_current_profile_avatar(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_my_companies() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_workspace_members() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.switch_current_company(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_workspace_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_workspace_member_role(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.money_agent_fee(uuid, text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_commission(uuid, text, numeric) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_current_profile_identity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_current_profile_identity(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_profile_avatar(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_workspace_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_current_company(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_workspace_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_workspace_member_role(uuid, text) TO authenticated;

COMMIT;
