-- Owner-only cross-warehouse stock summary.
-- The aggregation runs inside the database and returns totals only; it does not
-- weaken the active-warehouse RLS policies used by normal inventory queries.

begin;

create or replace function public.warehouse_cross_warehouse_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_company_id uuid := public.current_company_id();
  v_summary jsonb;
begin
  if auth.uid() is null or v_company_id is null then
    raise exception 'An authenticated company session is required.' using errcode = '28000';
  end if;
  if not public.warehouse_is_owner() then
    raise exception 'Only the organization owner can view the cross-warehouse stock summary.' using errcode = '42501';
  end if;

  with warehouse_stock as (
    select
      w.id as warehouse_id,
      w.name as warehouse_name,
      count(i.id)::integer as sku_count,
      coalesce(sum(case
        when coalesce(i.data->>'qty_on_hand', i.data->>'quantity') ~ '^-?[0-9]+(\.[0-9]+)?$'
          then coalesce(i.data->>'qty_on_hand', i.data->>'quantity')::numeric
        else 0
      end), 0)::numeric as quantity,
      coalesce(sum(
        (case
          when coalesce(i.data->>'qty_on_hand', i.data->>'quantity') ~ '^-?[0-9]+(\.[0-9]+)?$'
            then coalesce(i.data->>'qty_on_hand', i.data->>'quantity')::numeric
          else 0
        end) *
        (case
          when coalesce(i.data->>'unit_cost', i.amount::text) ~ '^-?[0-9]+(\.[0-9]+)?$'
            then coalesce(i.data->>'unit_cost', i.amount::text)::numeric
          else 0
        end)
      ), 0)::numeric as stock_value,
      count(*) filter (where
        (case
          when coalesce(i.data->>'qty_on_hand', i.data->>'quantity') ~ '^-?[0-9]+(\.[0-9]+)?$'
            then coalesce(i.data->>'qty_on_hand', i.data->>'quantity')::numeric
          else 0
        end) <=
        (case
          when coalesce(i.data->>'reorder_level', '0') ~ '^-?[0-9]+(\.[0-9]+)?$'
            then coalesce(i.data->>'reorder_level', '0')::numeric
          else 0
        end)
      )::integer as low_stock_count
    from public.inventory_warehouses w
    left join public.inventory_items i
      on i.company_id = v_company_id
     and i.data->>'warehouse_id' = w.id::text
    where w.company_id = v_company_id
      and coalesce(lower(w.status), 'active') not in ('archived', 'inactive', 'disabled')
    group by w.id, w.name
  ), totals as (
    select
      coalesce(sum(sku_count), 0)::integer as sku_count,
      coalesce(sum(quantity), 0)::numeric as quantity,
      coalesce(sum(stock_value), 0)::numeric as stock_value,
      coalesce(sum(low_stock_count), 0)::integer as low_stock_count
    from warehouse_stock
  )
  select jsonb_build_object(
    'companyId', v_company_id,
    'generatedAt', now(),
    'warehouses', coalesce((select jsonb_agg(to_jsonb(warehouse_stock) order by warehouse_name) from warehouse_stock), '[]'::jsonb),
    'totals', (select to_jsonb(totals) from totals)
  ) into v_summary;

  return v_summary;
end;
$$;

revoke all on function public.warehouse_cross_warehouse_summary() from public, anon, authenticated;
grant execute on function public.warehouse_cross_warehouse_summary() to authenticated;

commit;
