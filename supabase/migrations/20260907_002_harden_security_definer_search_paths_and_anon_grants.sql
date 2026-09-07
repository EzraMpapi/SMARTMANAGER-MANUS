-- Pin SECURITY DEFINER lookup paths and restrict anonymous execution.
-- Applied to Supabase project rlhngsrihahhyxnjxrxm on 2026-09-07.
-- The four anonymous booking RPCs are intentionally public.

do $$
declare
  fn record;
begin
  for fn in
    select n.nspname as schema_name, p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = pg_catalog, public, auth, pg_temp',
      fn.schema_name, fn.function_name, fn.identity_args
    );
  end loop;
end
$$;

do $$
declare
  fn record;
begin
  for fn in
    select n.nspname as schema_name, p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and not (
        (p.proname = 'cancel_booking' and pg_get_function_identity_arguments(p.oid) = 'p_locator text, p_surname text, p_refund_minor bigint, p_refund_pct smallint')
        or (p.proname = 'extend_hold' and pg_get_function_identity_arguments(p.oid) = 'p_hold_token uuid, p_ttl_seconds integer')
        or (p.proname = 'get_booking' and pg_get_function_identity_arguments(p.oid) = 'p_locator text, p_surname text')
        or (p.proname = 'hold_seats' and pg_get_function_identity_arguments(p.oid) = 'p_service_key text, p_seats smallint[], p_ttl_seconds integer')
      )
  loop
    execute format('revoke execute on function %I.%I(%s) from anon', fn.schema_name, fn.function_name, fn.identity_args);
  end loop;
end
$$;
