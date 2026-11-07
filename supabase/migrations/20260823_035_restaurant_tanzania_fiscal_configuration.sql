-- Tanzania Restaurant fiscalization, tax-profile, and mobile-money readiness extension.
-- Official TRA/VFD receipt numbers are never synthesized locally: they remain null until an approved provider returns them.
BEGIN;

CREATE TABLE IF NOT EXISTS public.restaurant_tax_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES public.restaurant_outlets(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  tax_type text NOT NULL DEFAULT 'Taxable' CHECK (tax_type IN ('Taxable','Zero Rated','Exempt','Special')),
  rate_percent numeric(9,6) NOT NULL DEFAULT 18 CHECK (rate_percent >= 0 AND rate_percent <= 100),
  is_inclusive boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  legal_basis text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id, code)
);
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_tax_profile_one_default_idx ON public.restaurant_tax_profiles(outlet_id) WHERE is_default AND is_active;

CREATE TABLE IF NOT EXISTS public.restaurant_fiscal_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES public.restaurant_outlets(id) ON DELETE CASCADE,
  tax_profile_id uuid REFERENCES public.restaurant_tax_profiles(id) ON DELETE SET NULL,
  tin text NOT NULL,
  vrn text,
  business_name text NOT NULL,
  trading_name text,
  physical_address text,
  region text,
  district text,
  device_serial text,
  provider_code text NOT NULL DEFAULT 'UNCONFIGURED',
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  status text NOT NULL DEFAULT 'Awaiting Configuration' CHECK (status IN ('Awaiting Configuration','Ready for Provider Validation','Active','Suspended','Offline')),
  receipt_prefix text NOT NULL DEFAULT 'RFS',
  fiscalized_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id)
);

CREATE TABLE IF NOT EXISTS public.restaurant_fiscal_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES public.restaurant_outlets(id) ON DELETE CASCADE,
  fiscal_profile_id uuid REFERENCES public.restaurant_fiscal_profiles(id) ON DELETE SET NULL,
  order_id uuid NOT NULL REFERENCES public.restaurant_orders(id) ON DELETE RESTRICT,
  internal_reference text NOT NULL,
  official_receipt_number text,
  fiscal_serial text,
  verification_code text,
  qr_payload text,
  status text NOT NULL DEFAULT 'Awaiting Configuration' CHECK (status IN ('Awaiting Configuration','Queued','Submitting','Submitted','Verified','Rejected','Cancelled','Voided')),
  gross_amount numeric(18,2) NOT NULL CHECK (gross_amount >= 0),
  vat_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
  net_amount numeric(18,2) NOT NULL CHECK (net_amount >= 0),
  currency text NOT NULL DEFAULT 'TZS',
  idempotency_key text NOT NULL,
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  failure_reason text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id,order_id),
  UNIQUE(company_id,idempotency_key),
  UNIQUE(company_id,internal_reference),
  UNIQUE(company_id,official_receipt_number)
);
CREATE INDEX IF NOT EXISTS restaurant_fiscal_receipts_queue_idx ON public.restaurant_fiscal_receipts(company_id,status,queued_at);

CREATE TABLE IF NOT EXISTS public.restaurant_mobile_money_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES public.restaurant_outlets(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('HarakaPay','M-Pesa','Tigo Pesa','Airtel Money','HaloPesa','Manual')),
  merchant_label text NOT NULL,
  merchant_account_reference text,
  collection_mode text NOT NULL DEFAULT 'Customer Initiated' CHECK (collection_mode IN ('Customer Initiated','STK Push','USSD','Manual Verification')),
  status text NOT NULL DEFAULT 'Configured' CHECK (status IN ('Disabled','Configured','Active','Suspended')),
  webhook_configured boolean NOT NULL DEFAULT false,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(outlet_id,provider)
);

CREATE TABLE IF NOT EXISTS public.restaurant_mobile_money_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  outlet_id uuid NOT NULL REFERENCES public.restaurant_outlets(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.restaurant_orders(id) ON DELETE RESTRICT,
  profile_id uuid NOT NULL REFERENCES public.restaurant_mobile_money_profiles(id) ON DELETE RESTRICT,
  provider_reference text NOT NULL,
  phone_last_four text,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'TZS',
  status text NOT NULL DEFAULT 'Initiated' CHECK (status IN ('Initiated','Pending','Successful','Failed','Expired','Cancelled')),
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  failure_reason text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id,provider_reference)
);
CREATE INDEX IF NOT EXISTS restaurant_mobile_money_intents_status_idx ON public.restaurant_mobile_money_intents(company_id,status,created_at DESC);

CREATE OR REPLACE FUNCTION public.restaurant_tanzania_audit(p_action text,p_subject text,p_id uuid,p_detail jsonb DEFAULT '{}'::jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.restaurant_audit_events(company_id,outlet_id,action,subject_type,subject_id,detail)
  VALUES(public.current_company_id(),nullif(p_detail->>'outletId','')::uuid,p_action,p_subject,p_id,coalesce(p_detail,'{}'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.restaurant_tanzania_snapshot() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid := public.current_company_id();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'An authenticated restaurant session is required.' USING ERRCODE='28000'; END IF;
  RETURN jsonb_build_object(
    'taxProfiles',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.is_default DESC,x.code) FROM public.restaurant_tax_profiles x WHERE x.company_id=c),'[]'::jsonb),
    'fiscalProfiles',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.updated_at DESC) FROM public.restaurant_fiscal_profiles x WHERE x.company_id=c),'[]'::jsonb),
    'fiscalReceipts',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM public.restaurant_fiscal_receipts x WHERE x.company_id=c LIMIT 200),'[]'::jsonb),
    'mobileMoneyProfiles',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.provider) FROM public.restaurant_mobile_money_profiles x WHERE x.company_id=c),'[]'::jsonb),
    'mobileMoneyIntents',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM public.restaurant_mobile_money_intents x WHERE x.company_id=c LIMIT 200),'[]'::jsonb)
  );
END $$;

CREATE OR REPLACE FUNCTION public.restaurant_tanzania_action(p_action text,p_payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c uuid := public.current_company_id(); v_id uuid; v_order public.restaurant_orders%ROWTYPE; v_profile public.restaurant_mobile_money_profiles%ROWTYPE; v_ref text; v_phone text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'An authenticated restaurant session is required.' USING ERRCODE='28000'; END IF;
  IF p_action='TAX_PROFILE_SAVE' THEN
    IF NOT public.restaurant_is_manager() THEN RAISE EXCEPTION 'Restaurant manager permission required.' USING ERRCODE='42501'; END IF;
    IF coalesce(nullif(p_payload->>'taxType',''),'Taxable')='Taxable' AND coalesce(nullif(p_payload->>'ratePercent','')::numeric,18) <> 18 THEN
      RAISE EXCEPTION 'A taxable Tanzania standard VAT profile must use 18%% unless a separately authorised special treatment is configured.' USING ERRCODE='22023';
    END IF;
    IF coalesce((p_payload->>'isDefault')::boolean,false) THEN UPDATE public.restaurant_tax_profiles SET is_default=false,updated_at=now() WHERE outlet_id=(p_payload->>'outletId')::uuid AND company_id=c; END IF;
    INSERT INTO public.restaurant_tax_profiles(company_id,outlet_id,code,name,tax_type,rate_percent,is_inclusive,is_default,is_active,legal_basis)
    VALUES(c,(p_payload->>'outletId')::uuid,upper(p_payload->>'code'),p_payload->>'name',coalesce(nullif(p_payload->>'taxType',''),'Taxable'),coalesce(nullif(p_payload->>'ratePercent','')::numeric,18),coalesce((p_payload->>'isInclusive')::boolean,false),coalesce((p_payload->>'isDefault')::boolean,false),coalesce((p_payload->>'isActive')::boolean,true),p_payload->>'legalBasis')
    ON CONFLICT(outlet_id,code) DO UPDATE SET name=excluded.name,tax_type=excluded.tax_type,rate_percent=excluded.rate_percent,is_inclusive=excluded.is_inclusive,is_default=excluded.is_default,is_active=excluded.is_active,legal_basis=excluded.legal_basis,updated_at=now() RETURNING id INTO v_id;
  ELSIF p_action='FISCAL_PROFILE_SAVE' THEN
    IF NOT public.restaurant_is_manager() THEN RAISE EXCEPTION 'Restaurant manager permission required.' USING ERRCODE='42501'; END IF;
    INSERT INTO public.restaurant_fiscal_profiles(company_id,outlet_id,tax_profile_id,tin,vrn,business_name,trading_name,physical_address,region,district,device_serial,provider_code,environment,status,receipt_prefix,data)
    VALUES(c,(p_payload->>'outletId')::uuid,nullif(p_payload->>'taxProfileId','')::uuid,p_payload->>'tin',nullif(p_payload->>'vrn',''),p_payload->>'businessName',nullif(p_payload->>'tradingName',''),nullif(p_payload->>'physicalAddress',''),nullif(p_payload->>'region',''),nullif(p_payload->>'district',''),nullif(p_payload->>'deviceSerial',''),coalesce(nullif(p_payload->>'providerCode',''),'UNCONFIGURED'),coalesce(nullif(p_payload->>'environment',''),'sandbox'),'Awaiting Configuration',coalesce(nullif(p_payload->>'receiptPrefix',''),'RFS'),coalesce(p_payload->'data','{}'::jsonb))
    ON CONFLICT(outlet_id) DO UPDATE SET tax_profile_id=excluded.tax_profile_id,tin=excluded.tin,vrn=excluded.vrn,business_name=excluded.business_name,trading_name=excluded.trading_name,physical_address=excluded.physical_address,region=excluded.region,district=excluded.district,device_serial=excluded.device_serial,provider_code=excluded.provider_code,environment=excluded.environment,status='Awaiting Configuration',receipt_prefix=excluded.receipt_prefix,data=excluded.data,updated_at=now() RETURNING id INTO v_id;
  ELSIF p_action='MOBILE_MONEY_PROFILE_SAVE' THEN
    IF NOT public.restaurant_is_manager() THEN RAISE EXCEPTION 'Restaurant manager permission required.' USING ERRCODE='42501'; END IF;
    INSERT INTO public.restaurant_mobile_money_profiles(company_id,outlet_id,provider,merchant_label,merchant_account_reference,collection_mode,status,webhook_configured,data)
    VALUES(c,(p_payload->>'outletId')::uuid,p_payload->>'provider',p_payload->>'merchantLabel',nullif(p_payload->>'merchantAccountReference',''),coalesce(nullif(p_payload->>'collectionMode',''),'Customer Initiated'),'Configured',false,coalesce(p_payload->'data','{}'::jsonb))
    ON CONFLICT(outlet_id,provider) DO UPDATE SET merchant_label=excluded.merchant_label,merchant_account_reference=excluded.merchant_account_reference,collection_mode=excluded.collection_mode,status='Configured',webhook_configured=false,data=excluded.data,updated_at=now() RETURNING id INTO v_id;
  ELSIF p_action='MOBILE_MONEY_INTENT_CREATE' THEN
    IF NOT public.restaurant_can_operate(ARRAY['Cashier','Restaurant Manager','Finance']) THEN RAISE EXCEPTION 'Cashier or manager permission required.' USING ERRCODE='42501'; END IF;
    SELECT * INTO v_order FROM public.restaurant_orders WHERE id=(p_payload->>'orderId')::uuid AND company_id=c FOR UPDATE;
    IF NOT FOUND OR v_order.status NOT IN ('Ready','Served','Preparing') THEN RAISE EXCEPTION 'Only a prepared or served order can request mobile-money collection.' USING ERRCODE='55000'; END IF;
    SELECT * INTO v_profile FROM public.restaurant_mobile_money_profiles WHERE id=(p_payload->>'profileId')::uuid AND company_id=c AND status IN ('Configured','Active');
    IF NOT FOUND THEN RAISE EXCEPTION 'An enabled Restaurant mobile-money profile is required.' USING ERRCODE='P0002'; END IF;
    IF v_profile.status<>'Active' THEN RAISE EXCEPTION 'Mobile-money collection is not active. Configure the provider webhook and server credentials first.' USING ERRCODE='55000'; END IF;
    v_phone:=regexp_replace(coalesce(p_payload->>'phone',''),'[^0-9+]','','g');
    IF v_phone !~ '^\+?255[0-9]{9}$' THEN RAISE EXCEPTION 'A valid Tanzanian mobile number is required.' USING ERRCODE='22023'; END IF;
    v_ref:=coalesce(nullif(p_payload->>'providerReference',''),'RMM-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)));
    INSERT INTO public.restaurant_mobile_money_intents(company_id,outlet_id,order_id,profile_id,provider_reference,phone_last_four,amount,currency,status,expires_at)
    VALUES(c,v_order.outlet_id,v_order.id,v_profile.id,v_ref,right(v_phone,4),coalesce(nullif(p_payload->>'amount','')::numeric,v_order.total_amount),v_order.currency,'Initiated',now()+interval '15 minutes') RETURNING id INTO v_id;
  ELSE RAISE EXCEPTION 'Unsupported Tanzania Restaurant action: %',p_action USING ERRCODE='22023'; END IF;
  PERFORM public.restaurant_tanzania_audit(p_action,split_part(p_action,'_',1),v_id,p_payload);
  RETURN jsonb_build_object('ok',true,'recordId',v_id,'snapshotRequired',true);
END $$;

CREATE OR REPLACE FUNCTION public.restaurant_enqueue_fiscal_receipt() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.restaurant_fiscal_profiles%ROWTYPE; ref text;
BEGIN
  IF NEW.status='Paid' AND OLD.status IS DISTINCT FROM 'Paid' THEN
    SELECT * INTO p FROM public.restaurant_fiscal_profiles WHERE outlet_id=NEW.outlet_id AND company_id=NEW.company_id;
    ref:=coalesce(p.receipt_prefix,'RFS')||'-'||to_char(NEW.closed_at AT TIME ZONE 'Africa/Dar_es_Salaam','YYYYMMDD')||'-'||upper(substr(replace(NEW.id::text,'-',''),1,8));
    INSERT INTO public.restaurant_fiscal_receipts(company_id,outlet_id,fiscal_profile_id,order_id,internal_reference,status,gross_amount,vat_amount,net_amount,currency,idempotency_key,failure_reason)
    VALUES(NEW.company_id,NEW.outlet_id,p.id,NEW.id,ref,CASE WHEN p.id IS NULL THEN 'Awaiting Configuration' WHEN p.status='Active' THEN 'Queued' ELSE 'Awaiting Configuration' END,NEW.total_amount,NEW.tax_amount,greatest(NEW.total_amount-NEW.tax_amount,0),NEW.currency,'restaurant-order:'||NEW.id,CASE WHEN p.id IS NULL THEN 'Fiscal profile not configured.' WHEN p.status<>'Active' THEN 'Approved fiscal provider is not active.' ELSE NULL END)
    ON CONFLICT(company_id,order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS restaurant_enqueue_fiscal_receipt_trigger ON public.restaurant_orders;
CREATE TRIGGER restaurant_enqueue_fiscal_receipt_trigger AFTER UPDATE OF status ON public.restaurant_orders FOR EACH ROW EXECUTE FUNCTION public.restaurant_enqueue_fiscal_receipt();

DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['restaurant_tax_profiles','restaurant_fiscal_profiles','restaurant_fiscal_receipts','restaurant_mobile_money_profiles','restaurant_mobile_money_intents'] LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_tenant_read',t); EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id=public.current_company_id())',t||'_tenant_read',t); END LOOP; END $$;
REVOKE ALL ON FUNCTION public.restaurant_tanzania_audit(text,text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.restaurant_tanzania_snapshot() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.restaurant_tanzania_action(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.restaurant_tanzania_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.restaurant_tanzania_action(text,jsonb) TO authenticated;
COMMIT;
