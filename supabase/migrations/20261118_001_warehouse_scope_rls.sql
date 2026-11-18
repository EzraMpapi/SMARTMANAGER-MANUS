-- Warehouse isolation and owner switching.
--
-- Warehouse scope is stored server-side per authenticated user/company. The
-- browser may request a switch, but it cannot bypass this context because all
-- inventory reads and writes are enforced by RLS.

begin;

create table if not exists public.warehouse_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  warehouse_id uuid not null references public.inventory_warehouses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, warehouse_id, user_id)
);

create table if not exists public.warehouse_user_context (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  warehouse_id uuid not null references public.inventory_warehouses(id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create index if not exists warehouse_memberships_user_company_idx
  on public.warehouse_memberships (user_id, company_id, status);
create index if not exists warehouse_memberships_warehouse_idx
  on public.warehouse_memberships (warehouse_id, company_id, status);

create or replace function public.warehouse_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce((
    select p.is_active
      and lower(trim(p.role)) in (
        'owner', 'organization owner', 'super administrator',
        'platform administrator', 'ceo'
      )
    from public.profiles p
    where p.id = auth.uid()
      and p.company_id = public.current_company_id()
    limit 1
  ), false);
$$;

create or replace function public.warehouse_can_access(p_warehouse_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select p_warehouse_id is not null
    and (
      public.warehouse_is_owner()
      or exists (
        select 1
        from public.warehouse_memberships wm
        where wm.company_id = public.current_company_id()
          and wm.warehouse_id = p_warehouse_id
          and wm.user_id = auth.uid()
          and lower(wm.status) = 'active'
      )
    );
$$;

create or replace function public.current_warehouse_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select c.warehouse_id
  from public.warehouse_user_context c
  where c.company_id = public.current_company_id()
    and c.user_id = auth.uid()
    and public.warehouse_can_access(c.warehouse_id)
  limit 1;
$$;

create or replace function public.warehouse_set_active(p_warehouse_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_company_id uuid := public.current_company_id();
  v_name text;
begin
  if auth.uid() is null or v_company_id is null then
    raise exception 'An authenticated company session is required.' using errcode = '28000';
  end if;
  if not public.warehouse_can_access(p_warehouse_id) then
    raise exception 'You are not authorised to use this warehouse.' using errcode = '42501';
  end if;

  select w.name into v_name
  from public.inventory_warehouses w
  where w.id = p_warehouse_id
    and w.company_id = v_company_id
    and coalesce(lower(w.status), 'active') not in ('archived', 'inactive', 'disabled')
  limit 1;

  if v_name is null then
    raise exception 'The selected warehouse is unavailable.' using errcode = '22023';
  end if;

  insert into public.warehouse_user_context(company_id, user_id, warehouse_id, updated_at)
  values (v_company_id, auth.uid(), p_warehouse_id, now())
  on conflict (company_id, user_id) do update
    set warehouse_id = excluded.warehouse_id,
        updated_at = now();

  return jsonb_build_object(
    'companyId', v_company_id,
    'warehouseId', p_warehouse_id,
    'warehouseName', v_name
  );
end;
$$;

alter table public.warehouse_memberships enable row level security;
alter table public.warehouse_user_context enable row level security;

grant select on table public.warehouse_memberships to authenticated;
grant insert, update, delete on table public.warehouse_memberships to authenticated;
grant select, insert, update on table public.warehouse_user_context to authenticated;
grant execute on function public.warehouse_is_owner() to authenticated;
grant execute on function public.warehouse_can_access(uuid) to authenticated;
grant execute on function public.current_warehouse_id() to authenticated;
grant execute on function public.warehouse_set_active(uuid) to authenticated;
revoke all on function public.warehouse_is_owner() from public, anon;
revoke all on function public.warehouse_can_access(uuid) from public, anon;
revoke all on function public.current_warehouse_id() from public, anon;
revoke all on function public.warehouse_set_active(uuid) from public, anon;

-- Memberships are visible only to the member or an owner. Only owners can
-- grant, revoke, or move warehouse access.
drop policy if exists warehouse_memberships_select on public.warehouse_memberships;
drop policy if exists warehouse_memberships_owner_write on public.warehouse_memberships;
create policy warehouse_memberships_select
  on public.warehouse_memberships for select to authenticated
  using (company_id = public.current_company_id() and (user_id = auth.uid() or public.warehouse_is_owner()));
create policy warehouse_memberships_owner_write
  on public.warehouse_memberships for all to authenticated
  using (
    company_id = public.current_company_id()
    and public.warehouse_is_owner()
  )
  with check (
    company_id = public.current_company_id()
    and public.warehouse_is_owner()
    and exists (
      select 1
      from public.inventory_warehouses w
      where w.id = warehouse_memberships.warehouse_id
        and w.company_id = warehouse_memberships.company_id
    )
  );

drop policy if exists warehouse_user_context_own_select on public.warehouse_user_context;
drop policy if exists warehouse_user_context_own_write on public.warehouse_user_context;
create policy warehouse_user_context_own_select
  on public.warehouse_user_context for select to authenticated
  using (company_id = public.current_company_id() and user_id = auth.uid());
create policy warehouse_user_context_own_write
  on public.warehouse_user_context for all to authenticated
  using (company_id = public.current_company_id() and user_id = auth.uid() and public.warehouse_can_access(warehouse_id))
  with check (company_id = public.current_company_id() and user_id = auth.uid() and public.warehouse_can_access(warehouse_id));

-- Owners can enumerate their company's warehouses so the switcher can render;
-- delegated users see only warehouses explicitly assigned to them.
drop policy if exists inventory_warehouses_tenant on public.inventory_warehouses;
create policy inventory_warehouses_scope
  on public.inventory_warehouses for select to authenticated
  using (company_id = public.current_company_id() and (public.warehouse_is_owner() or public.warehouse_can_access(id)));
create policy inventory_warehouses_owner_write
  on public.inventory_warehouses for all to authenticated
  using (company_id = public.current_company_id() and public.warehouse_is_owner())
  with check (company_id = public.current_company_id() and public.warehouse_is_owner());

-- Replace company-only inventory policies with active-warehouse policies.
drop policy if exists inventory_items_tenant on public.inventory_items;
create policy inventory_items_active_warehouse
  on public.inventory_items for select to authenticated
  using (
    company_id = public.current_company_id()
    and data->>'warehouse_id' = public.current_warehouse_id()::text
    and public.warehouse_can_access((data->>'warehouse_id')::uuid)
  );
create policy inventory_items_active_warehouse_write
  on public.inventory_items for all to authenticated
  using (
    company_id = public.current_company_id()
    and data->>'warehouse_id' = public.current_warehouse_id()::text
    and public.warehouse_can_access((data->>'warehouse_id')::uuid)
  )
  with check (
    company_id = public.current_company_id()
    and data->>'warehouse_id' = public.current_warehouse_id()::text
    and public.warehouse_can_access((data->>'warehouse_id')::uuid)
  );

drop policy if exists inventory_stock_movements_tenant on public.inventory_stock_movements;
create policy inventory_stock_movements_active_warehouse
  on public.inventory_stock_movements for select to authenticated
  using (
    company_id = public.current_company_id()
    and data->>'warehouse_id' = public.current_warehouse_id()::text
    and public.warehouse_can_access((data->>'warehouse_id')::uuid)
  );
create policy inventory_stock_movements_active_warehouse_write
  on public.inventory_stock_movements for all to authenticated
  using (
    company_id = public.current_company_id()
    and data->>'warehouse_id' = public.current_warehouse_id()::text
    and public.warehouse_can_access((data->>'warehouse_id')::uuid)
  )
  with check (
    company_id = public.current_company_id()
    and data->>'warehouse_id' = public.current_warehouse_id()::text
    and public.warehouse_can_access((data->>'warehouse_id')::uuid)
  );

drop policy if exists inventory_transfers_tenant on public.inventory_transfers;
create policy inventory_transfers_active_warehouse
  on public.inventory_transfers for select to authenticated
  using (
    company_id = public.current_company_id()
    and (
      data->>'from_warehouse' = public.current_warehouse_id()::text
      or data->>'to_warehouse' = public.current_warehouse_id()::text
    )
  );
create policy inventory_transfers_active_warehouse_write
  on public.inventory_transfers for all to authenticated
  using (
    company_id = public.current_company_id()
    and (
      data->>'from_warehouse' = public.current_warehouse_id()::text
      or data->>'to_warehouse' = public.current_warehouse_id()::text
    )
  )
  with check (
    company_id = public.current_company_id()
    and public.warehouse_can_access((data->>'from_warehouse')::uuid)
    and public.warehouse_can_access((data->>'to_warehouse')::uuid)
  );

-- Batch rows use the same generic data envelope as inventory_items.
do $$
begin
  if to_regclass('public.inventory_batches') is not null then
    execute 'drop policy if exists inventory_batches_tenant on public.inventory_batches';
    execute 'create policy inventory_batches_active_warehouse on public.inventory_batches for select to authenticated using (company_id = public.current_company_id() and data->>''warehouse_id'' = public.current_warehouse_id()::text and public.warehouse_can_access((data->>''warehouse_id'')::uuid))';
    execute 'create policy inventory_batches_active_warehouse_write on public.inventory_batches for all to authenticated using (company_id = public.current_company_id() and data->>''warehouse_id'' = public.current_warehouse_id()::text and public.warehouse_can_access((data->>''warehouse_id'')::uuid)) with check (company_id = public.current_company_id() and data->>''warehouse_id'' = public.current_warehouse_id()::text and public.warehouse_can_access((data->>''warehouse_id'')::uuid))';
  end if;
end;
$$;

commit;
