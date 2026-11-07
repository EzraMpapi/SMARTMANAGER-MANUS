-- The settings row is available only through platform-controlled SECURITY DEFINER functions.
-- This restrictive policy documents that no direct PostgREST access is intended for anon/authenticated roles.

create policy platform_admin_dashboard_settings_direct_rpc_only
  on public.platform_admin_dashboard_settings
  as restrictive
  for all
  to public
  using (false)
  with check (false);
