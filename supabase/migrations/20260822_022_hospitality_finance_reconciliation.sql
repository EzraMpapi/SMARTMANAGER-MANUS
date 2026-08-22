-- Hospitality end-of-day finance bridge: reconciles closed folios, posts a Finance/POS summary and a balanced General Ledger entry.
BEGIN;

CREATE TABLE IF NOT EXISTS public.hospitality_finance_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  status text NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Reconciled','Review','Voided')),
  currency text NOT NULL DEFAULT 'TZS',
  gross_revenue numeric(18,2) NOT NULL DEFAULT 0,
  tax_total numeric(18,2) NOT NULL DEFAULT 0,
  payment_total numeric(18,2) NOT NULL DEFAULT 0,
  refund_total numeric(18,2) NOT NULL DEFAULT 0,
  variance numeric(18,2) NOT NULL DEFAULT 0,
  pos_transaction_id uuid REFERENCES public.pos_transactions(id) ON DELETE SET NULL,
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  finance_reference text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, property_id, business_date)
);
CREATE INDEX IF NOT EXISTS hospitality_finance_reconciliations_company_date_idx ON public.hospitality_finance_reconciliations(company_id,business_date DESC);
ALTER TABLE public.hospitality_finance_reconciliations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hospitality_finance_reconciliations_tenant_select ON public.hospitality_finance_reconciliations;
DROP POLICY IF EXISTS hospitality_finance_reconciliations_tenant_write ON public.hospitality_finance_reconciliations;
CREATE POLICY hospitality_finance_reconciliations_tenant_select ON public.hospitality_finance_reconciliations FOR SELECT TO authenticated USING (company_id=public.current_company_id());
CREATE POLICY hospitality_finance_reconciliations_tenant_write ON public.hospitality_finance_reconciliations FOR ALL TO authenticated USING (company_id=public.current_company_id() AND public.hospitality_is_privileged()) WITH CHECK (company_id=public.current_company_id() AND public.hospitality_is_privileged());

CREATE OR REPLACE FUNCTION public.hospitality_reconcile_end_of_day(p_property_id uuid, p_business_date date DEFAULT current_date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_company uuid:=public.current_company_id(); v_currency text; v_timezone text; v_reference text;
  v_gross numeric:=0; v_tax numeric:=0; v_payments numeric:=0; v_refunds numeric:=0; v_variance numeric:=0;
  v_pos uuid; v_journal uuid; v_reconciliation uuid; v_status text; v_existing record;
BEGIN
  IF auth.uid() IS NULL OR NOT public.hospitality_is_privileged() THEN RAISE EXCEPTION 'A privileged authenticated hospitality session is required.' USING ERRCODE='42501'; END IF;
  IF p_business_date IS NULL THEN RAISE EXCEPTION 'A business date is required.' USING ERRCODE='22007'; END IF;
  SELECT currency,timezone INTO v_currency,v_timezone FROM public.hospitality_properties WHERE id=p_property_id AND company_id=v_company;
  IF v_currency IS NULL THEN RAISE EXCEPTION 'Hospitality property was not found.' USING ERRCODE='P0002'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_company::text||':'||p_property_id::text||':'||p_business_date::text));
  SELECT * INTO v_existing FROM public.hospitality_finance_reconciliations WHERE company_id=v_company AND property_id=p_property_id AND business_date=p_business_date LIMIT 1;
  IF v_existing.id IS NOT NULL AND v_existing.status='Reconciled' THEN
    RETURN jsonb_build_object('reconciliationId',v_existing.id,'status',v_existing.status,'financeReference',v_existing.finance_reference,'grossRevenue',v_existing.gross_revenue,'payments',v_existing.payment_total,'variance',v_existing.variance,'idempotentReplay',true);
  END IF;

  SELECT coalesce(sum(CASE WHEN fl.line_type IN ('Room','Dining','Minibar','Laundry','Event','Tax','Discount','Adjustment') THEN fl.amount+fl.tax_amount ELSE 0 END),0),
         coalesce(sum(CASE WHEN fl.line_type IN ('Room','Dining','Minibar','Laundry','Event','Tax','Discount','Adjustment') THEN fl.tax_amount ELSE 0 END),0),
         coalesce(sum(CASE WHEN fl.line_type='Refund' THEN abs(fl.amount)+abs(fl.tax_amount) ELSE 0 END),0)
    INTO v_gross,v_tax,v_refunds
    FROM public.hospitality_folio_lines fl
    JOIN public.hospitality_folios f ON f.id=fl.folio_id
    JOIN public.hospitality_reservations r ON r.id=f.reservation_id
   WHERE f.company_id=v_company AND f.property_id=p_property_id AND f.status='Closed'
     AND ((r.checked_out_at AT TIME ZONE coalesce(v_timezone,'Africa/Dar_es_Salaam'))::date)=p_business_date;
  SELECT coalesce(sum(hp.amount),0) INTO v_payments FROM public.hospitality_payments hp
    JOIN public.hospitality_folios f ON f.id=hp.folio_id
    JOIN public.hospitality_reservations r ON r.id=f.reservation_id
   WHERE hp.company_id=v_company AND f.property_id=p_property_id AND hp.status='Captured'
     AND ((r.checked_out_at AT TIME ZONE coalesce(v_timezone,'Africa/Dar_es_Salaam'))::date)=p_business_date;
  v_variance:=round(v_payments-(v_gross-v_refunds),2);
  v_status:=CASE WHEN abs(v_variance)<=0.01 THEN 'Reconciled' ELSE 'Review' END;
  v_reference:='HOSP-EOD-'||to_char(p_business_date,'YYYYMMDD')||'-'||upper(substr(p_property_id::text,1,8));

  INSERT INTO public.pos_transactions(company_id,name,status,amount,notes,data)
  VALUES(v_company,v_reference,CASE WHEN v_status='Reconciled' THEN 'Completed' ELSE 'Review' END,v_payments,'Hospitality end-of-day reconciliation',jsonb_build_object('module','Hospitality','reconciliation_reference',v_reference,'business_date',p_business_date,'gross_revenue',v_gross,'tax_total',v_tax,'refund_total',v_refunds,'payment_total',v_payments,'variance',v_variance,'property_id',p_property_id,'payment_status',v_status,'items',jsonb_build_array(jsonb_build_object('name','Hospitality revenue','qty',1,'price',v_gross-v_refunds))))
  RETURNING id INTO v_pos;
  INSERT INTO public.journal_entries(company_id,name,status,amount,notes,data)
  VALUES(v_company,v_reference,v_status,v_payments,'Hospitality EOD revenue reconciliation',jsonb_build_object('module','Hospitality','reconciliation_reference',v_reference,'business_date',p_business_date,'property_id',p_property_id,'currency',v_currency,'gross_revenue',v_gross,'tax_total',v_tax,'refund_total',v_refunds,'payment_total',v_payments,'variance',v_variance,'lines',jsonb_build_array(jsonb_build_object('account','Cash and Cash Equivalents','debit',v_payments,'credit',0),jsonb_build_object('account','Hospitality Revenue','debit',0,'credit',v_gross-v_refunds-v_tax),jsonb_build_object('account','Tax Payable','debit',0,'credit',v_tax))))
  RETURNING id INTO v_journal;
  INSERT INTO public.hospitality_finance_reconciliations(company_id,property_id,business_date,status,currency,gross_revenue,tax_total,payment_total,refund_total,variance,pos_transaction_id,journal_entry_id,finance_reference,data,created_by)
  VALUES(v_company,p_property_id,p_business_date,v_status,v_currency,v_gross,v_tax,v_payments,v_refunds,v_variance,v_pos,v_journal,v_reference,jsonb_build_object('timezone',v_timezone,'folioCount',(SELECT count(*) FROM public.hospitality_folios f JOIN public.hospitality_reservations r ON r.id=f.reservation_id WHERE f.company_id=v_company AND f.property_id=p_property_id AND f.status='Closed' AND ((r.checked_out_at AT TIME ZONE coalesce(v_timezone,'Africa/Dar_es_Salaam'))::date)=p_business_date)),auth.uid())
  ON CONFLICT(company_id,property_id,business_date) DO UPDATE SET status=EXCLUDED.status,gross_revenue=EXCLUDED.gross_revenue,tax_total=EXCLUDED.tax_total,payment_total=EXCLUDED.payment_total,refund_total=EXCLUDED.refund_total,variance=EXCLUDED.variance,pos_transaction_id=EXCLUDED.pos_transaction_id,journal_entry_id=EXCLUDED.journal_entry_id,finance_reference=EXCLUDED.finance_reference,data=EXCLUDED.data,updated_at=now()
  RETURNING id INTO v_reconciliation;
  UPDATE public.hospitality_folios f SET finance_reference=v_reference,updated_at=now()
  FROM public.hospitality_reservations r WHERE f.reservation_id=r.id AND f.company_id=v_company AND f.property_id=p_property_id AND f.status='Closed' AND ((r.checked_out_at AT TIME ZONE coalesce(v_timezone,'Africa/Dar_es_Salaam'))::date)=p_business_date;
  PERFORM public.hospitality_audit('END_OF_DAY_RECONCILIATION',v_reconciliation::text,jsonb_build_object('financeReference',v_reference,'businessDate',p_business_date,'grossRevenue',v_gross,'payments',v_payments,'variance',v_variance,'status',v_status,'journalEntryId',v_journal,'posTransactionId',v_pos));
  RETURN jsonb_build_object('reconciliationId',v_reconciliation,'status',v_status,'financeReference',v_reference,'grossRevenue',v_gross,'taxTotal',v_tax,'refundTotal',v_refunds,'payments',v_payments,'variance',v_variance,'posTransactionId',v_pos,'journalEntryId',v_journal,'idempotentReplay',false);
END $$;
REVOKE ALL ON FUNCTION public.hospitality_reconcile_end_of_day(uuid,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.hospitality_reconcile_end_of_day(uuid,date) TO authenticated;
COMMIT;
