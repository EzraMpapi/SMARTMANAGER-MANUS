alter table public.inventory_items add column if not exists image_url text;
comment on column public.inventory_items.image_url is 'Product image uploaded through the authenticated inventory image endpoint.';
