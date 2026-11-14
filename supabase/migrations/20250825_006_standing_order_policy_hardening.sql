-- Targeted Standing Order security/performance follow-up.
-- Keep tenant reads separate from privileged direct writes and index event lookup.

BEGIN;

CREATE INDEX IF NOT EXISTS bank_standing_order_events_standing_order_id_idx
  ON public.bank_standing_order_events(standing_order_id);

DROP POLICY IF EXISTS bank_standing_orders_tenant_write ON public.bank_standing_orders;

CREATE POLICY bank_standing_orders_tenant_insert
  ON public.bank_standing_orders FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND public.bank_is_privileged());

CREATE POLICY bank_standing_orders_tenant_update
  ON public.bank_standing_orders FOR UPDATE TO authenticated
  USING (company_id = public.current_company_id() AND public.bank_is_privileged())
  WITH CHECK (company_id = public.current_company_id() AND public.bank_is_privileged());

CREATE POLICY bank_standing_orders_tenant_delete
  ON public.bank_standing_orders FOR DELETE TO authenticated
  USING (company_id = public.current_company_id() AND public.bank_is_privileged());

COMMIT;
