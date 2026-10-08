-- Resolve the second default-argument overload.
--
-- bank_run_standing_orders() and bank_run_standing_orders(date, uuid,
-- integer DEFAULT ...) both matched a zero-argument call. Keep the public
-- zero-argument scheduler entry point and give the parameterized runner an
-- explicit name. The wrapper is recreated after the rename so its internal
-- call resolves to the renamed function.
ALTER FUNCTION public.bank_run_standing_orders(
  date,
  uuid,
  integer
) RENAME TO bank_run_standing_orders_for_date;

CREATE OR REPLACE FUNCTION public.bank_run_standing_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
BEGIN
  RETURN public.bank_run_standing_orders_for_date(current_date, NULL, 250);
END;
$$;

-- Preserve the historical three-argument call shape, but remove defaults from
-- it. This keeps existing internal callers valid while ensuring that a
-- zero-argument call can resolve only to bank_run_standing_orders().
CREATE OR REPLACE FUNCTION public.bank_run_standing_orders(
  p_run_date date,
  p_order_id uuid,
  p_max_orders integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
BEGIN
  RETURN public.bank_run_standing_orders_for_date(p_run_date, p_order_id, p_max_orders);
END;
$$;

REVOKE ALL ON FUNCTION public.bank_run_standing_orders_for_date(date, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bank_run_standing_orders_for_date(date, uuid, integer) TO authenticated;
COMMENT ON FUNCTION public.bank_run_standing_orders_for_date(date, uuid, integer) IS 'Parameterized standing-order runner. The zero-argument public entry point remains bank_run_standing_orders().';
