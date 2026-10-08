-- Money Agent core: Tanzania-ready, tenant-scoped, double-entry, maker-checker workflows.
-- No provider credentials or external-money calls are stored or performed here.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.money_agent_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_code text NOT NULL,
  name text NOT NULL,
  region text,
  district text,
  ward text,
  address text,
  phone text,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, branch_code)
);

CREATE TABLE IF NOT EXISTS public.money_agent_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.money_agent_branches(id) ON DELETE SET NULL,
  supervisor_id uuid REFERENCES public.money_agent_agents(id) ON DELETE SET NULL,
  agent_code text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  national_id text NOT NULL,
  kyc_status text NOT NULL DEFAULT 'Pending' CHECK (kyc_status IN ('Pending','Verified','Needs Review','Rejected')),
  kyb_status text NOT NULL DEFAULT 'Pending' CHECK (kyb_status IN ('Pending','Verified','Needs Review','Rejected')),
  status text NOT NULL DEFAULT 'Pending KYC' CHECK (status IN ('Active','Pending KYC','Suspended','Inactive')),
  daily_limit numeric(18,0) NOT NULL DEFAULT 5000000 CHECK (daily_limit >= 0),
  monthly_limit numeric(18,0) NOT NULL DEFAULT 100000000 CHECK (monthly_limit >= 0),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, agent_code),
  UNIQUE(company_id, phone),
  UNIQUE(company_id, national_id)
);

CREATE TABLE IF NOT EXISTS public.money_agent_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  national_id text,
  kyc_status text NOT NULL DEFAULT 'Pending' CHECK (kyc_status IN ('Pending','Verified','Needs Review','Rejected')),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Blocked','Inactive')),
  address text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, phone),
  UNIQUE(company_id, national_id),
  UNIQUE(company_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.money_agent_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_type text NOT NULL CHECK (owner_type IN ('Agent','Customer','Platform')),
  owner_id uuid NOT NULL,
  wallet_type text NOT NULL CHECK (wallet_type IN ('Float','Cash','Commission','Settlement')),
  currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  available_balance numeric(18,0) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Frozen','Closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, owner_type, owner_id, wallet_type)
);

CREATE TABLE IF NOT EXISTS public.money_agent_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  name text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('Cash In','Cash Out','Transfer','Bill Payment','Airtime','Data','Mobile Money','Bank to Wallet','Wallet to Bank')),
  provider_code text,
  requires_provider boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, service_code)
);

CREATE TABLE IF NOT EXISTS public.money_agent_fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  min_amount numeric(18,0) NOT NULL DEFAULT 0 CHECK (min_amount >= 0),
  max_amount numeric(18,0) CHECK (max_amount IS NULL OR max_amount >= min_amount),
  fee_type text NOT NULL CHECK (fee_type IN ('Flat','Percentage')),
  fee_value numeric(10,4) NOT NULL CHECK (fee_value >= 0),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, service_code, min_amount)
);

CREATE TABLE IF NOT EXISTS public.money_agent_commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  commission_type text NOT NULL CHECK (commission_type IN ('Flat','Percentage')),
  commission_value numeric(10,4) NOT NULL CHECK (commission_value >= 0),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, service_code)
);

CREATE TABLE IF NOT EXISTS public.money_agent_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.money_agent_agents(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  max_single_amount numeric(18,0) NOT NULL DEFAULT 1000000 CHECK (max_single_amount > 0),
  daily_amount numeric(18,0) NOT NULL DEFAULT 5000000 CHECK (daily_amount > 0),
  monthly_amount numeric(18,0) NOT NULL DEFAULT 100000000 CHECK (monthly_amount > 0),
  velocity_window_minutes integer NOT NULL DEFAULT 10 CHECK (velocity_window_minutes > 0),
  velocity_count integer NOT NULL DEFAULT 10 CHECK (velocity_count > 0),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, agent_id, transaction_type)
);

CREATE TABLE IF NOT EXISTS public.money_agent_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_ref text NOT NULL,
  idempotency_key text NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.money_agent_agents(id) ON DELETE RESTRICT,
  branch_id uuid REFERENCES public.money_agent_branches(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.money_agent_customers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.money_agent_services(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('Cash In','Cash Out','Transfer','Bill Payment','Airtime','Data','Mobile Money','Bank to Wallet','Wallet to Bank')),
  amount numeric(18,0) NOT NULL CHECK (amount > 0),
  fee numeric(18,0) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  commission numeric(18,0) NOT NULL DEFAULT 0 CHECK (commission >= 0),
  currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  status text NOT NULL DEFAULT 'Awaiting Authorization' CHECK (status IN ('Draft','Awaiting Authorization','Processing','Pending Provider','Successful','Failed','Reversed','Refunded')),
  authorization_method text,
  authorization_reference_hash text,
  provider_code text,
  provider_reference text,
  failure_code text,
  failure_reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  authorized_at timestamptz,
  processed_at timestamptz,
  completed_at timestamptz,
  reversed_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, transaction_ref),
  UNIQUE(company_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.money_agent_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.money_agent_transactions(id) ON DELETE RESTRICT,
  account_code text NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('Debit','Credit')),
  amount numeric(18,0) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'TZS' CHECK (currency = 'TZS'),
  posted_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.money_agent_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.money_agent_transactions(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  requested_by uuid REFERENCES public.profiles(id),
  decided_by uuid REFERENCES public.profiles(id),
  note text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE(company_id, transaction_id)
);

CREATE TABLE IF NOT EXISTS public.money_agent_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.money_agent_agents(id) ON DELETE RESTRICT,
  branch_id uuid REFERENCES public.money_agent_branches(id) ON DELETE SET NULL,
  business_date date NOT NULL,
  opening_float numeric(18,0) NOT NULL DEFAULT 0 CHECK (opening_float >= 0),
  closing_float numeric(18,0) NOT NULL DEFAULT 0 CHECK (closing_float >= 0),
  expected_float numeric(18,0) NOT NULL DEFAULT 0 CHECK (expected_float >= 0),
  variance numeric(18,0) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Submitted','Settled','Variance Review')),
  submitted_by uuid REFERENCES public.profiles(id),
  settled_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, agent_id, business_date)
);

CREATE TABLE IF NOT EXISTS public.money_agent_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  settlement_id uuid NOT NULL REFERENCES public.money_agent_settlements(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Matched','Variance','Approved')),
  expected_amount numeric(18,0) NOT NULL DEFAULT 0 CHECK (expected_amount >= 0),
  actual_amount numeric(18,0) NOT NULL DEFAULT 0 CHECK (actual_amount >= 0),
  variance numeric(18,0) NOT NULL DEFAULT 0,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, settlement_id)
);

CREATE TABLE IF NOT EXISTS public.money_agent_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.money_agent_agents(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('Info','Warning','Critical')),
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Acknowledged','Resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_by uuid REFERENCES public.profiles(id),
  acknowledged_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.money_agent_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.money_agent_pin_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.money_agent_agents(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  locked_until timestamptz,
  last_used_at timestamptz,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Locked','Revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, agent_id)
);

CREATE TABLE IF NOT EXISTS public.money_agent_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.money_agent_transactions(id) ON DELETE RESTRICT,
  receipt_number text NOT NULL,
  channel text NOT NULL DEFAULT 'Dashboard' CHECK (channel IN ('Dashboard','SMS','WhatsApp','Email')),
  recipient_phone text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(company_id, transaction_id),
  UNIQUE(company_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS public.money_agent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.money_agent_transactions(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES public.money_agent_agents(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('In App','SMS','WhatsApp','Email')),
  status text NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued','Sent','Failed','Read')),
  title text NOT NULL,
  body text NOT NULL,
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  read_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.money_agent_risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.money_agent_agents(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.money_agent_transactions(id) ON DELETE SET NULL,
  risk_type text NOT NULL CHECK (risk_type IN ('Velocity','Limit','Duplicate','KYC','Liquidity','Unusual Pattern','Manual Review')),
  severity text NOT NULL CHECK (severity IN ('Low','Medium','High','Critical')),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Investigating','Cleared','Confirmed')),
  score numeric(5,2) CHECK (score >= 0 AND score <= 100),
  reason text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.money_agent_daily_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.money_agent_agents(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.money_agent_branches(id) ON DELETE SET NULL,
  business_date date NOT NULL,
  transaction_count integer NOT NULL DEFAULT 0 CHECK (transaction_count >= 0),
  successful_count integer NOT NULL DEFAULT 0 CHECK (successful_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  cash_in_amount numeric(18,0) NOT NULL DEFAULT 0 CHECK (cash_in_amount >= 0),
  cash_out_amount numeric(18,0) NOT NULL DEFAULT 0 CHECK (cash_out_amount >= 0),
  fee_amount numeric(18,0) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  commission_amount numeric(18,0) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, agent_id, business_date)
);

CREATE INDEX IF NOT EXISTS money_agent_transactions_company_status_idx ON public.money_agent_transactions(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS money_agent_transactions_agent_date_idx ON public.money_agent_transactions(company_id, agent_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS money_agent_ledger_transaction_idx ON public.money_agent_ledger_entries(company_id, transaction_id, posted_at);
CREATE INDEX IF NOT EXISTS money_agent_alerts_company_status_idx ON public.money_agent_alerts(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS money_agent_settlements_company_date_idx ON public.money_agent_settlements(company_id, business_date DESC);

CREATE OR REPLACE FUNCTION public.money_agent_has_role(p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND coalesce(p.is_active, true)
      AND lower(coalesce(p.role,'')) = ANY (SELECT lower(x) FROM unnest(p_roles) x)
  ) OR EXISTS (
    SELECT 1 FROM public.company_memberships m
    WHERE m.user_id = auth.uid() AND m.company_id = public.current_company_id()
      AND lower(coalesce(m.role,'')) = ANY (SELECT lower(x) FROM unnest(p_roles) x)
  );
$$;

CREATE OR REPLACE FUNCTION public.money_agent_can_view()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT public.money_agent_has_role(ARRAY['super administrator','platform administrator','institution administrator','organization owner','owner','ceo','cfo','finance manager','branch manager','money agent manager','money agent','agent','supervisor','auditor','internal auditor','teller','cashier','finance officer']);
$$;

CREATE OR REPLACE FUNCTION public.money_agent_can_customer_portal()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT public.money_agent_has_role(ARRAY['customer']);
$$;

CREATE OR REPLACE FUNCTION public.money_agent_can_operate()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT public.money_agent_has_role(ARRAY['super administrator','platform administrator','institution administrator','organization owner','owner','ceo','cfo','finance manager','branch manager','money agent manager','money agent','agent','supervisor','teller','cashier','finance officer']);
$$;

CREATE OR REPLACE FUNCTION public.money_agent_can_manage()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT public.money_agent_has_role(ARRAY['super administrator','platform administrator','institution administrator','organization owner','owner','ceo','cfo','finance manager','branch manager','money agent manager']);
$$;

CREATE OR REPLACE FUNCTION public.money_agent_can_approve()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT public.money_agent_has_role(ARRAY['super administrator','platform administrator','institution administrator','organization owner','owner','ceo','cfo','finance manager','branch manager','money agent manager','supervisor']);
$$;

CREATE OR REPLACE FUNCTION public.money_agent_can_audit()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT public.money_agent_has_role(ARRAY['super administrator','platform administrator','institution administrator','organization owner','owner','ceo','cfo','finance manager','branch manager','money agent manager','supervisor','auditor','internal auditor']);
$$;

CREATE OR REPLACE FUNCTION public.money_agent_require(p_capability text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'An authenticated Money Agent session is required.' USING ERRCODE='28000'; END IF;
  IF p_capability='view' AND NOT public.money_agent_can_view() THEN RAISE EXCEPTION 'Your role cannot view Money Agent operations.' USING ERRCODE='42501'; END IF;
  IF p_capability='operate' AND NOT public.money_agent_can_operate() THEN RAISE EXCEPTION 'Your role cannot operate Money Agent transactions.' USING ERRCODE='42501'; END IF;
  IF p_capability='manage' AND NOT public.money_agent_can_manage() THEN RAISE EXCEPTION 'Your role cannot manage Money Agent configuration.' USING ERRCODE='42501'; END IF;
  IF p_capability='approve' AND NOT public.money_agent_can_approve() THEN RAISE EXCEPTION 'Your role cannot approve Money Agent transactions.' USING ERRCODE='42501'; END IF;
  IF p_capability='audit' AND NOT public.money_agent_can_audit() THEN RAISE EXCEPTION 'Your role cannot review Money Agent audit data.' USING ERRCODE='42501'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.money_agent_audit(p_action text, p_entity_type text, p_entity_id uuid, p_before jsonb DEFAULT NULL, p_after jsonb DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  INSERT INTO public.money_agent_audit_events(company_id, actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata)
  VALUES (public.current_company_id(), auth.uid(), p_action, p_entity_type, p_entity_id, p_before, p_after, coalesce(p_metadata,'{}'::jsonb));
END; $$;

CREATE OR REPLACE FUNCTION public.money_agent_block_direct_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('money_agent.internal_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Money Agent financial history is immutable and can only change through its protected workflow.' USING ERRCODE='42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS money_agent_transactions_immutable_guard ON public.money_agent_transactions;
CREATE TRIGGER money_agent_transactions_immutable_guard BEFORE UPDATE OR DELETE ON public.money_agent_transactions FOR EACH ROW EXECUTE FUNCTION public.money_agent_block_direct_mutation();
DROP TRIGGER IF EXISTS money_agent_ledger_immutable_guard ON public.money_agent_ledger_entries;
CREATE TRIGGER money_agent_ledger_immutable_guard BEFORE UPDATE OR DELETE ON public.money_agent_ledger_entries FOR EACH ROW EXECUTE FUNCTION public.money_agent_block_direct_mutation();
DROP TRIGGER IF EXISTS money_agent_audit_immutable_guard ON public.money_agent_audit_events;
CREATE TRIGGER money_agent_audit_immutable_guard BEFORE UPDATE OR DELETE ON public.money_agent_audit_events FOR EACH ROW EXECUTE FUNCTION public.money_agent_block_direct_mutation();

CREATE OR REPLACE FUNCTION public.money_agent_fee(p_company uuid, p_service_code text, p_amount numeric)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT CASE WHEN r.fee_type='Percentage' THEN round(p_amount*r.fee_value/100) ELSE r.fee_value END FROM public.money_agent_fee_rules r WHERE r.company_id=p_company AND r.service_code=p_service_code AND r.active AND p_amount>=r.min_amount AND (r.max_amount IS NULL OR p_amount<=r.max_amount) ORDER BY r.min_amount DESC LIMIT 1),0);
$$;

CREATE OR REPLACE FUNCTION public.money_agent_commission(p_company uuid, p_service_code text, p_amount numeric)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT CASE WHEN r.commission_type='Percentage' THEN round(p_amount*r.commission_value/100) ELSE r.commission_value END FROM public.money_agent_commission_rules r WHERE r.company_id=p_company AND r.service_code=p_service_code AND r.active LIMIT 1),0);
$$;

CREATE OR REPLACE FUNCTION public.money_agent_ledger_post(p_transaction uuid, p_entries jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  entry jsonb;
  debit_total numeric:=0;
  credit_total numeric:=0;
BEGIN
  FOR entry IN SELECT value FROM jsonb_array_elements(coalesce(p_entries,'[]'::jsonb)) LOOP
    IF coalesce((entry->>'amount')::numeric,0)<=0 OR entry->>'account' IS NULL OR entry->>'entryType' NOT IN ('Debit','Credit') THEN
      RAISE EXCEPTION 'Invalid Money Agent ledger posting.' USING ERRCODE='22023';
    END IF;
    IF entry->>'entryType'='Debit' THEN debit_total:=debit_total+(entry->>'amount')::numeric; ELSE credit_total:=credit_total+(entry->>'amount')::numeric; END IF;
    INSERT INTO public.money_agent_ledger_entries(company_id,transaction_id,account_code,entry_type,amount,metadata)
    VALUES(public.current_company_id(),p_transaction,entry->>'account',(entry->>'entryType'),(entry->>'amount')::numeric,coalesce(entry->'metadata','{}'::jsonb));
  END LOOP;
  IF debit_total<>credit_total OR debit_total=0 THEN RAISE EXCEPTION 'Money Agent ledger entry is not balanced.' USING ERRCODE='22023'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.money_agent_snapshot(p_limit integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE c uuid:=public.current_company_id(); l integer:=greatest(1,least(coalesce(p_limit,100),200)); v_agent_restricted boolean:=public.money_agent_has_role(ARRAY['money agent','agent','teller','cashier']);
BEGIN
  PERFORM public.money_agent_require('view');
  RETURN jsonb_build_object(
    'companyId',c,
    'currency','TZS',
    'timezone','Africa/Dar_es_Salaam',
    'permissions',jsonb_build_object('canOperate',public.money_agent_can_operate(),'canManage',public.money_agent_can_manage(),'canApprove',public.money_agent_can_approve(),'canAudit',public.money_agent_can_audit()),
    'metrics',jsonb_build_object(
      'agentCount',(SELECT count(*) FROM public.money_agent_agents a WHERE a.company_id=c AND (NOT v_agent_restricted OR a.profile_id=auth.uid())),
      'activeAgentCount',(SELECT count(*) FROM public.money_agent_agents a WHERE a.company_id=c AND a.status='Active' AND (NOT v_agent_restricted OR a.profile_id=auth.uid())),
      'customerCount',(SELECT count(*) FROM public.money_agent_customers cu WHERE cu.company_id=c AND cu.status='Active' AND (NOT v_agent_restricted OR cu.created_by=auth.uid() OR EXISTS (SELECT 1 FROM public.money_agent_transactions t JOIN public.money_agent_agents a ON a.id=t.agent_id WHERE t.company_id=c AND t.customer_id=cu.id AND a.profile_id=auth.uid()))),
      'floatBalance',coalesce((SELECT sum(available_balance) FROM public.money_agent_wallets w WHERE w.company_id=c AND w.owner_type='Agent' AND w.wallet_type='Float' AND w.status='Active' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=w.owner_id AND a.profile_id=auth.uid()))),0),
      'cashBalance',coalesce((SELECT sum(available_balance) FROM public.money_agent_wallets w WHERE w.company_id=c AND w.owner_type='Agent' AND w.wallet_type='Cash' AND w.status='Active' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=w.owner_id AND a.profile_id=auth.uid()))),0),
      'commissionBalance',coalesce((SELECT sum(available_balance) FROM public.money_agent_wallets w WHERE w.company_id=c AND w.owner_type='Agent' AND w.wallet_type='Commission' AND w.status='Active' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=w.owner_id AND a.profile_id=auth.uid()))),0),
      'todayTransactions',(SELECT count(*) FROM public.money_agent_transactions t WHERE t.company_id=c AND t.requested_at::date=(now() AT TIME ZONE 'Africa/Dar_es_Salaam')::date AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid()))),
      'pendingTransactions',(SELECT count(*) FROM public.money_agent_transactions t WHERE t.company_id=c AND t.status IN ('Awaiting Authorization','Processing','Pending Provider') AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid()))),
      'successfulTransactions',(SELECT count(*) FROM public.money_agent_transactions t WHERE t.company_id=c AND t.status='Successful' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid()))),
      'failedTransactions',(SELECT count(*) FROM public.money_agent_transactions t WHERE t.company_id=c AND t.status='Failed' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid()))),
      'cashInAmount',coalesce((SELECT sum(t.amount) FROM public.money_agent_transactions t WHERE t.company_id=c AND t.transaction_type='Cash In' AND t.status='Successful' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid()))),0),
      'cashOutAmount',coalesce((SELECT sum(t.amount) FROM public.money_agent_transactions t WHERE t.company_id=c AND t.transaction_type='Cash Out' AND t.status='Successful' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid()))),0),
      'feeRevenue',coalesce((SELECT sum(t.fee) FROM public.money_agent_transactions t WHERE t.company_id=c AND t.status='Successful' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid()))),0),
      'commissionAccrued',coalesce((SELECT sum(t.commission) FROM public.money_agent_transactions t WHERE t.company_id=c AND t.status='Successful' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid()))),0),
      'openRiskEvents',(SELECT count(*) FROM public.money_agent_risk_events r WHERE r.company_id=c AND r.status NOT IN ('Cleared','Confirmed') AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=r.agent_id AND a.profile_id=auth.uid()))),
      'openAlerts',(SELECT count(*) FROM public.money_agent_alerts r WHERE r.company_id=c AND r.status='Open' AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=r.agent_id AND a.profile_id=auth.uid())))
    ),
    'branches',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name) FROM (SELECT id,branch_code AS "branchCode",name,region,district,ward,address,phone,status FROM public.money_agent_branches b WHERE b.company_id=c AND (NOT v_agent_restricted OR b.id IN (SELECT a.branch_id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) LIMIT 200)x),'[]'::jsonb),
    'agents',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."createdAt" DESC) FROM (SELECT a.id,a.agent_code AS "agentCode",a.full_name AS "fullName",a.phone,a.national_id AS "nationalId",a.branch_id AS "branchId",a.supervisor_id AS "supervisorId",a.kyc_status AS "kycStatus",a.kyb_status AS "kybStatus",a.status,a.daily_limit AS "dailyLimit",a.monthly_limit AS "monthlyLimit",coalesce((SELECT pc.status FROM public.money_agent_pin_credentials pc WHERE pc.company_id=c AND pc.agent_id=a.id LIMIT 1),'Not configured') AS "pinStatus",a.created_at AS "createdAt" FROM public.money_agent_agents a WHERE a.company_id=c AND (NOT v_agent_restricted OR a.profile_id=auth.uid()) ORDER BY a.created_at DESC LIMIT 200)x),'[]'::jsonb),
    'customers',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."createdAt" DESC) FROM (SELECT id,full_name AS "fullName",phone,national_id AS "nationalId",kyc_status AS "kycStatus",status,created_at AS "createdAt" FROM public.money_agent_customers cu WHERE cu.company_id=c AND (NOT v_agent_restricted OR cu.created_by=auth.uid() OR EXISTS (SELECT 1 FROM public.money_agent_transactions t JOIN public.money_agent_agents a ON a.id=t.agent_id WHERE t.company_id=c AND t.customer_id=cu.id AND a.profile_id=auth.uid())) ORDER BY created_at DESC LIMIT 500)x),'[]'::jsonb),
    'wallets',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."ownerType",x."walletType") FROM (SELECT id,owner_type AS "ownerType",owner_id AS "ownerId",wallet_type AS "walletType",currency,available_balance AS "availableBalance",status FROM public.money_agent_wallets w WHERE w.company_id=c AND (NOT v_agent_restricted OR (w.owner_type='Agent' AND EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=w.owner_id AND a.profile_id=auth.uid()))) ORDER BY owner_type,wallet_type LIMIT 500)x),'[]'::jsonb),
    'services',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name) FROM (SELECT id,service_code AS "serviceCode",name,service_type AS "serviceType",provider_code AS "providerCode",requires_provider AS "requiresProvider",active FROM public.money_agent_services WHERE company_id=c ORDER BY name LIMIT 200)x),'[]'::jsonb),
    'feeRules',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."serviceCode",x."minAmount") FROM (SELECT id,service_code AS "serviceCode",min_amount AS "minAmount",max_amount AS "maxAmount",fee_type AS "feeType",fee_value AS "feeValue",active FROM public.money_agent_fee_rules WHERE company_id=c ORDER BY service_code,min_amount LIMIT 200)x),'[]'::jsonb),
    'commissionRules',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."serviceCode") FROM (SELECT id,service_code AS "serviceCode",commission_type AS "commissionType",commission_value AS "commissionValue",active FROM public.money_agent_commission_rules WHERE company_id=c ORDER BY service_code LIMIT 200)x),'[]'::jsonb),
    'limits',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."transactionType") FROM (SELECT id,agent_id AS "agentId",transaction_type AS "transactionType",max_single_amount AS "maxSingleAmount",daily_amount AS "dailyAmount",monthly_amount AS "monthlyAmount",velocity_window_minutes AS "velocityWindowMinutes",velocity_count AS "velocityCount",active FROM public.money_agent_limits lim WHERE lim.company_id=c AND (NOT v_agent_restricted OR lim.agent_id IS NULL OR lim.agent_id IN (SELECT a.id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) ORDER BY transaction_type LIMIT 500)x),'[]'::jsonb),
    'transactions',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."requestedAt" DESC) FROM (SELECT id,transaction_ref AS "transactionRef",idempotency_key AS "idempotencyKey",agent_id AS "agentId",branch_id AS "branchId",customer_id AS "customerId",service_id AS "serviceId",transaction_type AS "transactionType",amount,fee,commission,currency,status,authorization_method AS "authorizationMethod",provider_code AS "providerCode",provider_reference AS "providerReference",failure_reason AS "failureReason",requested_at AS "requestedAt",completed_at AS "completedAt",created_at AS "createdAt" FROM public.money_agent_transactions t WHERE t.company_id=c AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid())) ORDER BY requested_at DESC LIMIT 500)x),'[]'::jsonb),
    'approvals',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."requestedAt" DESC) FROM (SELECT id,transaction_id AS "transactionId",status,requested_by AS "requestedBy",decided_by AS "decidedBy",note,requested_at AS "requestedAt",decided_at AS "decidedAt" FROM public.money_agent_approvals ap WHERE ap.company_id=c AND (NOT v_agent_restricted OR EXISTS (SELECT 1 FROM public.money_agent_transactions t JOIN public.money_agent_agents a ON a.id=t.agent_id WHERE t.company_id=c AND t.id=ap.transaction_id AND a.profile_id=auth.uid())) ORDER BY requested_at DESC LIMIT 200)x),'[]'::jsonb),
    'settlements',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."businessDate" DESC) FROM (SELECT id,agent_id AS "agentId",branch_id AS "branchId",business_date AS "businessDate",opening_float AS "openingFloat",closing_float AS "closingFloat",expected_float AS "expectedFloat",variance,status,notes FROM public.money_agent_settlements s WHERE s.company_id=c AND (NOT v_agent_restricted OR s.agent_id IN (SELECT a.id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) ORDER BY business_date DESC LIMIT 200)x),'[]'::jsonb),
    'reconciliations',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."createdAt" DESC) FROM (SELECT r.id,r.settlement_id AS "settlementId",r.status,r.expected_amount AS "expectedAmount",r.actual_amount AS "actualAmount",r.variance,r.notes FROM public.money_agent_reconciliations r JOIN public.money_agent_settlements s ON s.id=r.settlement_id WHERE r.company_id=c AND (NOT v_agent_restricted OR s.agent_id IN (SELECT a.id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) ORDER BY r.created_at DESC LIMIT 200)x),'[]'::jsonb),
    'alerts',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."createdAt" DESC) FROM (SELECT al.id,al.agent_id AS "agentId",al.alert_type AS "alertType",al.severity,al.title,al.body,al.status,al.created_at AS "createdAt" FROM public.money_agent_alerts al WHERE al.company_id=c AND al.status<>'Resolved' AND (NOT v_agent_restricted OR al.agent_id IN (SELECT a.id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) ORDER BY al.created_at DESC LIMIT 200)x),'[]'::jsonb),
    'receipts',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."issuedAt" DESC) FROM (SELECT rc.id,rc.transaction_id AS "transactionId",rc.receipt_number AS "receiptNumber",rc.channel,rc.recipient_phone AS "recipientPhone",rc.issued_at AS "issuedAt" FROM public.money_agent_receipts rc JOIN public.money_agent_transactions t ON t.id=rc.transaction_id WHERE rc.company_id=c AND (NOT v_agent_restricted OR t.agent_id IN (SELECT a.id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) ORDER BY rc.issued_at DESC LIMIT 200)x),'[]'::jsonb),
    'notifications',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."createdAt" DESC) FROM (SELECT n.id,n.transaction_id AS "transactionId",n.agent_id AS "agentId",n.channel,n.status,n.title,n.body,n.created_at AS "createdAt" FROM public.money_agent_notifications n WHERE n.company_id=c AND (NOT v_agent_restricted OR n.agent_id IN (SELECT a.id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) ORDER BY n.created_at DESC LIMIT 200)x),'[]'::jsonb),
    'riskEvents',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."createdAt" DESC) FROM (SELECT r.id,r.agent_id AS "agentId",r.transaction_id AS "transactionId",r.risk_type AS "riskType",r.severity,r.status,r.score,r.reason,r.created_at AS "createdAt" FROM public.money_agent_risk_events r WHERE r.company_id=c AND r.status NOT IN ('Cleared','Confirmed') AND (NOT v_agent_restricted OR r.agent_id IN (SELECT a.id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) ORDER BY r.created_at DESC LIMIT 200)x),'[]'::jsonb),
    'dailySummaries',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."businessDate" DESC) FROM (SELECT ds.id,ds.agent_id AS "agentId",ds.branch_id AS "branchId",ds.business_date AS "businessDate",ds.transaction_count AS "transactionCount",ds.successful_count AS "successfulCount",ds.failed_count AS "failedCount",ds.cash_in_amount AS "cashInAmount",ds.cash_out_amount AS "cashOutAmount",ds.fee_amount AS "feeAmount",ds.commission_amount AS "commissionAmount" FROM public.money_agent_daily_summaries ds WHERE ds.company_id=c AND (NOT v_agent_restricted OR ds.agent_id IN (SELECT a.id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) ORDER BY ds.business_date DESC LIMIT 200)x),'[]'::jsonb),
    'agentPerformance',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."successfulAmount" DESC) FROM (SELECT a.id,a.agent_code AS "agentCode",a.full_name AS "fullName",a.branch_id AS "branchId",count(t.id) FILTER (WHERE t.status='Successful') AS "successfulCount",coalesce(sum(t.amount) FILTER (WHERE t.status='Successful'),0) AS "successfulAmount",coalesce(sum(t.fee) FILTER (WHERE t.status='Successful'),0) AS "feeAmount",coalesce(sum(t.commission) FILTER (WHERE t.status='Successful'),0) AS "commissionAmount" FROM public.money_agent_agents a LEFT JOIN public.money_agent_transactions t ON t.agent_id=a.id AND t.company_id=c WHERE a.company_id=c AND (NOT v_agent_restricted OR a.profile_id=auth.uid()) GROUP BY a.id,a.agent_code,a.full_name,a.branch_id LIMIT 200)x),'[]'::jsonb),
    'branchPerformance',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."transactionAmount" DESC) FROM (SELECT b.id,b.branch_code AS "branchCode",b.name,count(t.id) FILTER (WHERE t.status='Successful') AS "successfulCount",coalesce(sum(t.amount) FILTER (WHERE t.status='Successful'),0) AS "transactionAmount",coalesce(sum(t.fee) FILTER (WHERE t.status='Successful'),0) AS "feeAmount" FROM public.money_agent_branches b LEFT JOIN public.money_agent_transactions t ON t.branch_id=b.id AND t.company_id=c WHERE b.company_id=c AND (NOT v_agent_restricted OR b.id IN (SELECT a.branch_id FROM public.money_agent_agents a WHERE a.company_id=c AND a.profile_id=auth.uid())) GROUP BY b.id,b.branch_code,b.name LIMIT 200)x),'[]'::jsonb),
    'customerActivity',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."transactionCount" DESC) FROM (SELECT cu.id,cu.full_name AS "fullName",cu.phone,count(t.id) AS "transactionCount",coalesce(sum(t.amount) FILTER (WHERE t.status='Successful'),0) AS "successfulAmount" FROM public.money_agent_customers cu LEFT JOIN public.money_agent_transactions t ON t.customer_id=cu.id AND t.company_id=c WHERE cu.company_id=c AND (NOT v_agent_restricted OR cu.created_by=auth.uid() OR EXISTS (SELECT 1 FROM public.money_agent_agents a WHERE a.company_id=c AND a.id=t.agent_id AND a.profile_id=auth.uid())) GROUP BY cu.id,cu.full_name,cu.phone LIMIT 500)x),'[]'::jsonb),
    'auditEvents',CASE WHEN public.money_agent_can_audit() THEN coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."createdAt" DESC) FROM (SELECT id,actor_profile_id AS "actorProfileId",action,entity_type AS "entityType",entity_id AS "entityId",metadata,created_at AS "createdAt" FROM public.money_agent_audit_events WHERE company_id=c ORDER BY created_at DESC LIMIT 200)x),'[]'::jsonb) ELSE '[]'::jsonb END
  );
END; $$;

CREATE OR REPLACE FUNCTION public.money_agent_customer_snapshot(p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE c uuid:=public.current_company_id(); l integer:=greatest(1,least(coalesce(p_limit,50),100)); v_customer public.money_agent_customers%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.money_agent_can_customer_portal() THEN RAISE EXCEPTION 'An authenticated customer session is required.' USING ERRCODE='28000'; END IF;
  SELECT * INTO v_customer FROM public.money_agent_customers WHERE company_id=c AND profile_id=auth.uid() AND status='Active' LIMIT 1;
  IF v_customer.id IS NULL THEN RAISE EXCEPTION 'A verified Money Agent customer profile is required.' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object(
    'customer',jsonb_build_object('id',v_customer.id,'fullName',v_customer.full_name,'phone',v_customer.phone,'kycStatus',v_customer.kyc_status,'status',v_customer.status),
    'currency','TZS','timezone','Africa/Dar_es_Salaam',
    'wallets',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT wallet_type AS "walletType",currency,available_balance AS "availableBalance",status FROM public.money_agent_wallets WHERE company_id=c AND owner_type='Customer' AND owner_id=v_customer.id LIMIT 20)x),'[]'::jsonb),
    'transactions',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."requestedAt" DESC) FROM (SELECT id,transaction_ref AS "transactionRef",transaction_type AS "transactionType",amount,fee,currency,status,provider_reference AS "providerReference",requested_at AS "requestedAt",completed_at AS "completedAt" FROM public.money_agent_transactions WHERE company_id=c AND customer_id=v_customer.id ORDER BY requested_at DESC LIMIT l)x),'[]'::jsonb),
    'receipts',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."issuedAt" DESC) FROM (SELECT id,transaction_id AS "transactionId",receipt_number AS "receiptNumber",channel,issued_at AS "issuedAt" FROM public.money_agent_receipts WHERE company_id=c AND transaction_id IN (SELECT id FROM public.money_agent_transactions WHERE company_id=c AND customer_id=v_customer.id) ORDER BY issued_at DESC LIMIT l)x),'[]'::jsonb),
    'notifications',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x."createdAt" DESC) FROM (SELECT id,title,body,status,created_at AS "createdAt" FROM public.money_agent_notifications WHERE company_id=c AND (transaction_id IN (SELECT id FROM public.money_agent_transactions WHERE company_id=c AND customer_id=v_customer.id) OR agent_id IS NULL) ORDER BY created_at DESC LIMIT l)x),'[]'::jsonb)
  );
END; $$;

CREATE OR REPLACE FUNCTION public.money_agent_action(p_action text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  c uuid:=public.current_company_id(); v_id uuid; v_agent uuid; v_agent_row public.money_agent_agents%ROWTYPE; v_customer uuid; v_service uuid; v_branch uuid; v_tx public.money_agent_transactions%ROWTYPE; v_wallet public.money_agent_wallets%ROWTYPE; v_other_wallet public.money_agent_wallets%ROWTYPE; v_rule public.money_agent_limits%ROWTYPE; v_fee numeric:=0; v_commission numeric:=0; v_total numeric:=0; v_amount numeric:=0; v_type text; v_status text; v_now timestamptz:=now(); v_existing uuid; v_business_date date;
  v_entries jsonb; v_current_day numeric:=0; v_current_month numeric:=0; v_velocity integer:=0;
BEGIN
  IF p_action IN ('REGISTER_BRANCH','REGISTER_AGENT','REGISTER_SERVICE','CONFIGURE_FEE','CONFIGURE_COMMISSION','CONFIGURE_LIMIT','SETTLE_DAY','SET_AGENT_PIN','VERIFY_AGENT_KYC','VERIFY_CUSTOMER_KYC') THEN PERFORM public.money_agent_require('manage');
  ELSIF p_action IN ('CREATE_TRANSACTION','REGISTER_CUSTOMER') THEN PERFORM public.money_agent_require('operate');
  ELSIF p_action IN ('APPROVE_TRANSACTION','REJECT_TRANSACTION','REVERSE_TRANSACTION','REFUND_TRANSACTION') THEN PERFORM public.money_agent_require('approve');
  ELSIF p_action IN ('ACK_ALERT','REVIEW_RECONCILIATION') THEN PERFORM public.money_agent_require('audit');
  ELSE RAISE EXCEPTION 'Unsupported Money Agent action.' USING ERRCODE='22023'; END IF;

  PERFORM set_config('money_agent.internal_write','on',true);

  IF p_action='REGISTER_BRANCH' THEN
    INSERT INTO public.money_agent_branches(company_id,branch_code,name,region,district,ward,address,phone,created_by)
    VALUES(c,upper(trim(p_payload->>'branchCode')),trim(p_payload->>'name'),nullif(trim(p_payload->>'region'),''),nullif(trim(p_payload->>'district'),''),nullif(trim(p_payload->>'ward'),''),nullif(trim(p_payload->>'address'),''),nullif(trim(p_payload->>'phone'),''),auth.uid()) RETURNING id INTO v_id;
    PERFORM public.money_agent_audit('BRANCH_REGISTERED','Branch',v_id,NULL,p_payload);
    RETURN jsonb_build_object('id',v_id,'status','Active');
  ELSIF p_action='REGISTER_AGENT' THEN
    IF nullif(trim(p_payload->>'profileId'),'') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=(p_payload->>'profileId')::uuid AND company_id=c AND coalesce(is_active,true)) THEN RAISE EXCEPTION 'The selected agent profile is not active in this workspace.' USING ERRCODE='42501'; END IF;
    v_branch:=nullif(p_payload->>'branchId','')::uuid;
    IF v_branch IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.money_agent_branches WHERE id=v_branch AND company_id=c AND status='Active') THEN RAISE EXCEPTION 'The selected Money Agent branch is unavailable.' USING ERRCODE='22023'; END IF;
    IF nullif(trim(p_payload->>'supervisorId'),'') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.money_agent_agents WHERE id=(p_payload->>'supervisorId')::uuid AND company_id=c AND status='Active') THEN RAISE EXCEPTION 'The selected Money Agent supervisor is unavailable.' USING ERRCODE='22023'; END IF;
    INSERT INTO public.money_agent_agents(company_id,profile_id,branch_id,supervisor_id,agent_code,full_name,phone,national_id,kyc_status,kyb_status,status,daily_limit,monthly_limit,notes,metadata,created_by)
    VALUES(c,nullif(p_payload->>'profileId','')::uuid,v_branch,nullif(p_payload->>'supervisorId','')::uuid,upper(trim(p_payload->>'agentCode')),trim(p_payload->>'fullName'),trim(p_payload->>'phone'),trim(p_payload->>'nationalId'),coalesce(p_payload->>'kycStatus','Pending'),coalesce(p_payload->>'kybStatus','Pending'),CASE WHEN p_payload->>'kycStatus'='Verified' AND p_payload->>'kybStatus'='Verified' THEN 'Active' ELSE 'Pending KYC' END,coalesce(nullif(p_payload->>'dailyLimit','')::numeric,5000000),coalesce(nullif(p_payload->>'monthlyLimit','')::numeric,100000000),nullif(trim(p_payload->>'notes'),''),coalesce(p_payload->'metadata','{}'::jsonb),auth.uid()) RETURNING id INTO v_id;
    INSERT INTO public.money_agent_wallets(company_id,owner_type,owner_id,wallet_type) VALUES(c,'Agent',v_id,'Float'),(c,'Agent',v_id,'Cash'),(c,'Agent',v_id,'Commission');
    PERFORM public.money_agent_audit('AGENT_REGISTERED','Agent',v_id,NULL,p_payload);
    RETURN jsonb_build_object('id',v_id,'status',(SELECT status FROM public.money_agent_agents WHERE id=v_id));
  ELSIF p_action='REGISTER_CUSTOMER' THEN
    IF nullif(trim(p_payload->>'profileId'),'') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=(p_payload->>'profileId')::uuid AND company_id=c AND coalesce(is_active,true)) THEN RAISE EXCEPTION 'The selected customer profile is not active in this workspace.' USING ERRCODE='42501'; END IF;
    INSERT INTO public.money_agent_customers(company_id,profile_id,full_name,phone,national_id,kyc_status,address,metadata,created_by)
    VALUES(c,nullif(p_payload->>'profileId','')::uuid,trim(p_payload->>'fullName'),trim(p_payload->>'phone'),nullif(trim(p_payload->>'nationalId'),''),coalesce(p_payload->>'kycStatus','Pending'),nullif(trim(p_payload->>'address'),''),coalesce(p_payload->'metadata','{}'::jsonb),auth.uid()) RETURNING id INTO v_id;
    INSERT INTO public.money_agent_wallets(company_id,owner_type,owner_id,wallet_type) VALUES(c,'Customer',v_id,'Settlement');
    PERFORM public.money_agent_audit('CUSTOMER_REGISTERED','Customer',v_id,NULL,jsonb_build_object('kycStatus',p_payload->>'kycStatus','profileLinked',p_payload->>'profileId' IS NOT NULL));
    RETURN jsonb_build_object('id',v_id,'status','Active');
  ELSIF p_action='REGISTER_SERVICE' THEN
    INSERT INTO public.money_agent_services(company_id,service_code,name,service_type,provider_code,requires_provider,active,metadata,created_by)
    VALUES(c,upper(trim(p_payload->>'serviceCode')),trim(p_payload->>'name'),p_payload->>'serviceType',nullif(trim(p_payload->>'providerCode'),''),coalesce((p_payload->>'requiresProvider')::boolean,true),coalesce((p_payload->>'active')::boolean,true),coalesce(p_payload->'metadata','{}'::jsonb),auth.uid()) RETURNING id INTO v_id;
    PERFORM public.money_agent_audit('SERVICE_REGISTERED','Service',v_id,NULL,p_payload);
    RETURN jsonb_build_object('id',v_id,'status','Active');
  ELSIF p_action='CONFIGURE_FEE' THEN
    INSERT INTO public.money_agent_fee_rules(company_id,service_code,min_amount,max_amount,fee_type,fee_value,active,created_by)
    VALUES(c,upper(trim(p_payload->>'serviceCode')),coalesce(nullif(p_payload->>'minAmount','')::numeric,0),nullif(p_payload->>'maxAmount','')::numeric,p_payload->>'feeType',(p_payload->>'feeValue')::numeric,coalesce((p_payload->>'active')::boolean,true),auth.uid()) ON CONFLICT(company_id,service_code,min_amount) DO UPDATE SET max_amount=EXCLUDED.max_amount,fee_type=EXCLUDED.fee_type,fee_value=EXCLUDED.fee_value,active=EXCLUDED.active,updated_at=v_now RETURNING id INTO v_id;
    PERFORM public.money_agent_audit('FEE_RULE_CONFIGURED','FeeRule',v_id,NULL,p_payload);
    RETURN jsonb_build_object('id',v_id);
  ELSIF p_action='CONFIGURE_COMMISSION' THEN
    INSERT INTO public.money_agent_commission_rules(company_id,service_code,commission_type,commission_value,active,created_by)
    VALUES(c,upper(trim(p_payload->>'serviceCode')),p_payload->>'commissionType',(p_payload->>'commissionValue')::numeric,coalesce((p_payload->>'active')::boolean,true),auth.uid()) ON CONFLICT(company_id,service_code) DO UPDATE SET commission_type=EXCLUDED.commission_type,commission_value=EXCLUDED.commission_value,active=EXCLUDED.active,updated_at=v_now RETURNING id INTO v_id;
    PERFORM public.money_agent_audit('COMMISSION_RULE_CONFIGURED','CommissionRule',v_id,NULL,p_payload);
    RETURN jsonb_build_object('id',v_id);
  ELSIF p_action='CONFIGURE_LIMIT' THEN
    v_agent:=nullif(p_payload->>'agentId','')::uuid;
    IF v_agent IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.money_agent_agents WHERE id=v_agent AND company_id=c) THEN RAISE EXCEPTION 'The selected Money Agent is unavailable.' USING ERRCODE='22023'; END IF;
    INSERT INTO public.money_agent_limits(company_id,agent_id,transaction_type,max_single_amount,daily_amount,monthly_amount,velocity_window_minutes,velocity_count,active,created_by)
    VALUES(c,v_agent,p_payload->>'transactionType',(p_payload->>'maxSingleAmount')::numeric,(p_payload->>'dailyAmount')::numeric,(p_payload->>'monthlyAmount')::numeric,coalesce(nullif(p_payload->>'velocityWindowMinutes','')::integer,10),coalesce(nullif(p_payload->>'velocityCount','')::integer,10),coalesce((p_payload->>'active')::boolean,true),auth.uid()) ON CONFLICT(company_id,agent_id,transaction_type) DO UPDATE SET max_single_amount=EXCLUDED.max_single_amount,daily_amount=EXCLUDED.daily_amount,monthly_amount=EXCLUDED.monthly_amount,velocity_window_minutes=EXCLUDED.velocity_window_minutes,velocity_count=EXCLUDED.velocity_count,active=EXCLUDED.active,updated_at=v_now RETURNING id INTO v_id;
    PERFORM public.money_agent_audit('LIMIT_CONFIGURED','Limit',v_id,NULL,p_payload);
    RETURN jsonb_build_object('id',v_id);
  ELSIF p_action='VERIFY_AGENT_KYC' THEN
    v_agent:=(p_payload->>'agentId')::uuid;
    IF NOT EXISTS(SELECT 1 FROM public.money_agent_agents WHERE id=v_agent AND company_id=c) THEN RAISE EXCEPTION 'The selected Money Agent is unavailable.' USING ERRCODE='22023'; END IF;
    UPDATE public.money_agent_agents SET kyc_status=p_payload->>'kycStatus',kyb_status=p_payload->>'kybStatus',status=CASE WHEN p_payload->>'kycStatus'='Verified' AND p_payload->>'kybStatus'='Verified' THEN 'Active' WHEN p_payload->>'kycStatus'='Rejected' OR p_payload->>'kybStatus'='Rejected' THEN 'Inactive' ELSE 'Pending KYC' END,updated_at=v_now WHERE id=v_agent AND company_id=c RETURNING id INTO v_id;
    PERFORM public.money_agent_audit('AGENT_KYC_KYB_REVIEWED','Agent',v_id,NULL,jsonb_build_object('kycStatus',p_payload->>'kycStatus','kybStatus',p_payload->>'kybStatus','note',left(p_payload->>'note',500)));
    RETURN jsonb_build_object('id',v_id,'status',(SELECT status FROM public.money_agent_agents WHERE id=v_id));
  ELSIF p_action='VERIFY_CUSTOMER_KYC' THEN
    v_customer:=(p_payload->>'customerId')::uuid;
    UPDATE public.money_agent_customers SET kyc_status=p_payload->>'kycStatus',updated_at=v_now WHERE id=v_customer AND company_id=c RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'The selected customer is unavailable.' USING ERRCODE='22023'; END IF;
    PERFORM public.money_agent_audit('CUSTOMER_KYC_REVIEWED','Customer',v_id,NULL,jsonb_build_object('kycStatus',p_payload->>'kycStatus','note',left(p_payload->>'note',500)));
    RETURN jsonb_build_object('id',v_id,'status',(SELECT kyc_status FROM public.money_agent_customers WHERE id=v_id));
  ELSIF p_action='SET_AGENT_PIN' THEN
    v_agent:=(p_payload->>'agentId')::uuid;
    IF p_payload->>'pin' !~ '^\\d{4,6}$' THEN RAISE EXCEPTION 'Agent PIN must contain 4 to 6 digits.' USING ERRCODE='22023'; END IF;
    IF NOT EXISTS(SELECT 1 FROM public.money_agent_agents WHERE id=v_agent AND company_id=c) THEN RAISE EXCEPTION 'The selected Money Agent is unavailable.' USING ERRCODE='22023'; END IF;
    INSERT INTO public.money_agent_pin_credentials(company_id,agent_id,pin_hash,failed_attempts,locked_until,last_used_at,status,updated_at)
    VALUES(c,v_agent,crypt(p_payload->>'pin',gen_salt('bf')),0,NULL,NULL,'Active',v_now)
    ON CONFLICT(company_id,agent_id) DO UPDATE SET pin_hash=EXCLUDED.pin_hash,failed_attempts=0,locked_until=NULL,last_used_at=NULL,status='Active',updated_at=v_now
    RETURNING id INTO v_id;
    PERFORM public.money_agent_audit('AGENT_PIN_CONFIGURED','AgentPin',v_agent,NULL,jsonb_build_object('status','Active'));
    RETURN jsonb_build_object('id',v_id,'agentId',v_agent,'status','Active');
  ELSIF p_action='CREATE_TRANSACTION' THEN
    v_type:=p_payload->>'transactionType'; v_amount:=coalesce(nullif(p_payload->>'amount','')::numeric,0); v_agent:=nullif(p_payload->>'agentId','')::uuid; v_customer:=nullif(p_payload->>'customerId','')::uuid; v_service:=nullif(p_payload->>'serviceId','')::uuid;
    IF v_agent IS NULL THEN SELECT id INTO v_agent FROM public.money_agent_agents WHERE company_id=c AND profile_id=auth.uid() AND status='Active' LIMIT 1; END IF;
    IF public.money_agent_has_role(ARRAY['money agent','agent','teller','cashier']) AND NOT EXISTS(SELECT 1 FROM public.money_agent_agents WHERE id=v_agent AND company_id=c AND profile_id=auth.uid()) THEN RAISE EXCEPTION 'A frontline Money Agent can only transact for their own assigned profile.' USING ERRCODE='42501'; END IF;
    SELECT * INTO v_tx FROM public.money_agent_transactions WHERE company_id=c AND idempotency_key=trim(p_payload->>'idempotencyKey') LIMIT 1;
    IF v_tx.id IS NOT NULL THEN RETURN jsonb_build_object('id',v_tx.id,'transactionRef',v_tx.transaction_ref,'status',v_tx.status,'reused',true); END IF;
    IF v_amount<=0 OR v_type NOT IN ('Cash In','Cash Out','Transfer','Bill Payment','Airtime','Data','Mobile Money','Bank to Wallet','Wallet to Bank') THEN RAISE EXCEPTION 'A valid Money Agent transaction type and positive TZS amount are required.' USING ERRCODE='22023'; END IF;
    SELECT * INTO v_agent_row FROM public.money_agent_agents WHERE id=v_agent AND company_id=c FOR UPDATE;
    IF v_agent_row.id IS NULL OR v_agent_row.status<>'Active' OR v_agent_row.kyc_status<>'Verified' OR v_agent_row.kyb_status<>'Verified' THEN RAISE EXCEPTION 'The Money Agent must be active with verified KYC and KYB.' USING ERRCODE='42501'; END IF;
    IF v_customer IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.money_agent_customers WHERE id=v_customer AND company_id=c AND status='Active') THEN RAISE EXCEPTION 'The selected customer is unavailable.' USING ERRCODE='22023'; END IF;
    IF v_service IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.money_agent_services WHERE id=v_service AND company_id=c AND active) THEN RAISE EXCEPTION 'The selected service is unavailable.' USING ERRCODE='22023'; END IF;
    v_fee:=public.money_agent_fee(c,coalesce((SELECT service_code FROM public.money_agent_services WHERE id=v_service),'CASH_'||upper(replace(v_type,' ',''))),v_amount);
    v_commission:=least(v_fee,public.money_agent_commission(c,coalesce((SELECT service_code FROM public.money_agent_services WHERE id=v_service),'CASH_'||upper(replace(v_type,' ',''))),v_amount));
    SELECT * INTO v_rule FROM public.money_agent_limits WHERE company_id=c AND (agent_id=v_agent OR agent_id IS NULL) AND transaction_type=v_type AND active ORDER BY agent_id NULLS LAST LIMIT 1;
    IF v_rule.id IS NULL THEN v_rule.max_single_amount:=(SELECT daily_limit FROM public.money_agent_agents WHERE id=v_agent); v_rule.daily_amount:=v_rule.max_single_amount; v_rule.monthly_amount:=(SELECT monthly_limit FROM public.money_agent_agents WHERE id=v_agent); v_rule.velocity_window_minutes:=10; v_rule.velocity_count:=10; END IF;
    v_branch:=nullif(p_payload->>'branchId','')::uuid; IF v_branch IS NULL THEN SELECT branch_id INTO v_branch FROM public.money_agent_agents WHERE id=v_agent; END IF;
    IF v_branch IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.money_agent_agents WHERE id=v_agent AND company_id=c AND branch_id=v_branch) THEN RAISE EXCEPTION 'The transaction branch must match the assigned Money Agent branch.' USING ERRCODE='42501'; END IF;
    IF v_amount>v_rule.max_single_amount THEN
      INSERT INTO public.money_agent_transactions(company_id,transaction_ref,idempotency_key,agent_id,branch_id,customer_id,service_id,transaction_type,amount,fee,commission,status,failure_code,failure_reason,authorization_method,authorization_reference_hash,provider_code,metadata,created_by)
      VALUES(c,'MA-'||to_char(v_now AT TIME ZONE 'Africa/Dar_es_Salaam','YYYYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),trim(p_payload->>'idempotencyKey'),v_agent,v_branch,v_customer,v_service,v_type,v_amount,v_fee,v_commission,'Failed','LIMIT_SINGLE','This transaction exceeds the configured single-transaction limit.',nullif(p_payload->>'authorizationMethod',''),CASE WHEN nullif(p_payload->>'authorizationReference','') IS NULL THEN NULL ELSE md5(p_payload->>'authorizationReference') END,(SELECT provider_code FROM public.money_agent_services WHERE id=v_service),coalesce(p_payload->'metadata','{}'::jsonb),auth.uid()) RETURNING * INTO v_tx;
      INSERT INTO public.money_agent_risk_events(company_id,agent_id,transaction_id,risk_type,severity,status,score,reason,metadata) VALUES(c,v_agent,v_tx.id,'Limit','High','Open',80,'Single-transaction limit blocked the request.',jsonb_build_object('limit',v_rule.max_single_amount,'amount',v_amount));
      PERFORM public.money_agent_audit('TRANSACTION_LIMIT_BLOCKED','Transaction',v_tx.id,NULL,jsonb_build_object('status','Failed','failureCode','LIMIT_SINGLE'));
      RETURN jsonb_build_object('id',v_tx.id,'transactionRef',v_tx.transaction_ref,'status','Failed','riskRecorded',true);
    END IF;
    SELECT coalesce(sum(amount),0) INTO v_current_day FROM public.money_agent_transactions WHERE company_id=c AND agent_id=v_agent AND status IN ('Awaiting Authorization','Processing','Pending Provider','Successful') AND requested_at::date=(now() AT TIME ZONE 'Africa/Dar_es_Salaam')::date;
    SELECT coalesce(sum(amount),0) INTO v_current_month FROM public.money_agent_transactions WHERE company_id=c AND agent_id=v_agent AND status IN ('Awaiting Authorization','Processing','Pending Provider','Successful') AND date_trunc('month',requested_at AT TIME ZONE 'Africa/Dar_es_Salaam')=date_trunc('month',now() AT TIME ZONE 'Africa/Dar_es_Salaam');
    SELECT count(*) INTO v_velocity FROM public.money_agent_transactions WHERE company_id=c AND agent_id=v_agent AND status IN ('Awaiting Authorization','Processing','Pending Provider','Successful') AND requested_at>v_now-(v_rule.velocity_window_minutes||' minutes')::interval;
    IF v_current_day+v_amount>v_rule.daily_amount OR v_current_month+v_amount>v_rule.monthly_amount THEN
      INSERT INTO public.money_agent_transactions(company_id,transaction_ref,idempotency_key,agent_id,branch_id,customer_id,service_id,transaction_type,amount,fee,commission,status,failure_code,failure_reason,authorization_method,authorization_reference_hash,provider_code,metadata,created_by)
      VALUES(c,'MA-'||to_char(v_now AT TIME ZONE 'Africa/Dar_es_Salaam','YYYYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),trim(p_payload->>'idempotencyKey'),v_agent,v_branch,v_customer,v_service,v_type,v_amount,v_fee,v_commission,'Failed','LIMIT_PERIOD','This transaction exceeds the Money Agent daily or monthly limit.',nullif(p_payload->>'authorizationMethod',''),CASE WHEN nullif(p_payload->>'authorizationReference','') IS NULL THEN NULL ELSE md5(p_payload->>'authorizationReference') END,(SELECT provider_code FROM public.money_agent_services WHERE id=v_service),coalesce(p_payload->'metadata','{}'::jsonb),auth.uid()) RETURNING * INTO v_tx;
      INSERT INTO public.money_agent_risk_events(company_id,agent_id,transaction_id,risk_type,severity,status,score,reason,metadata) VALUES(c,v_agent,v_tx.id,'Limit','High','Open',85,'Daily or monthly transaction limit blocked the request.',jsonb_build_object('dailyLimit',v_rule.daily_amount,'monthlyLimit',v_rule.monthly_amount,'amount',v_amount));
      PERFORM public.money_agent_audit('TRANSACTION_PERIOD_LIMIT_BLOCKED','Transaction',v_tx.id,NULL,jsonb_build_object('status','Failed','failureCode','LIMIT_PERIOD'));
      RETURN jsonb_build_object('id',v_tx.id,'transactionRef',v_tx.transaction_ref,'status','Failed','riskRecorded',true);
    END IF;
    IF v_velocity>=v_rule.velocity_count THEN
      INSERT INTO public.money_agent_transactions(company_id,transaction_ref,idempotency_key,agent_id,branch_id,customer_id,service_id,transaction_type,amount,fee,commission,status,failure_code,failure_reason,authorization_method,authorization_reference_hash,provider_code,metadata,created_by)
      VALUES(c,'MA-'||to_char(v_now AT TIME ZONE 'Africa/Dar_es_Salaam','YYYYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),trim(p_payload->>'idempotencyKey'),v_agent,v_branch,v_customer,v_service,v_type,v_amount,v_fee,v_commission,'Failed','VELOCITY_BLOCK','Velocity protection paused this transaction.',nullif(p_payload->>'authorizationMethod',''),CASE WHEN nullif(p_payload->>'authorizationReference','') IS NULL THEN NULL ELSE md5(p_payload->>'authorizationReference') END,(SELECT provider_code FROM public.money_agent_services WHERE id=v_service),coalesce(p_payload->'metadata','{}'::jsonb),auth.uid()) RETURNING * INTO v_tx;
      INSERT INTO public.money_agent_risk_events(company_id,agent_id,transaction_id,risk_type,severity,status,score,reason,metadata) VALUES(c,v_agent,v_tx.id,'Velocity','High','Open',75,'Velocity protection paused the request.',jsonb_build_object('windowMinutes',v_rule.velocity_window_minutes,'count',v_velocity,'allowedCount',v_rule.velocity_count));
      PERFORM public.money_agent_audit('TRANSACTION_VELOCITY_BLOCKED','Transaction',v_tx.id,NULL,jsonb_build_object('status','Failed','failureCode','VELOCITY_BLOCK'));
      RETURN jsonb_build_object('id',v_tx.id,'transactionRef',v_tx.transaction_ref,'status','Failed','riskRecorded',true);
    END IF;
    INSERT INTO public.money_agent_transactions(company_id,transaction_ref,idempotency_key,agent_id,branch_id,customer_id,service_id,transaction_type,amount,fee,commission,authorization_method,authorization_reference_hash,provider_code,metadata,created_by)
    VALUES(c,'MA-'||to_char(v_now AT TIME ZONE 'Africa/Dar_es_Salaam','YYYYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),trim(p_payload->>'idempotencyKey'),v_agent,v_branch,v_customer,v_service,v_type,v_amount,v_fee,v_commission,nullif(p_payload->>'authorizationMethod',''),CASE WHEN nullif(p_payload->>'authorizationReference','') IS NULL THEN NULL ELSE md5(p_payload->>'authorizationReference') END,(SELECT provider_code FROM public.money_agent_services WHERE id=v_service),coalesce(p_payload->'metadata','{}'::jsonb),auth.uid()) RETURNING * INTO v_tx;
    INSERT INTO public.money_agent_approvals(company_id,transaction_id,requested_by) VALUES(c,v_tx.id,auth.uid());
    PERFORM public.money_agent_audit('TRANSACTION_CREATED','Transaction',v_tx.id,NULL,to_jsonb(v_tx),jsonb_build_object('requiresApproval',true));
    RETURN jsonb_build_object('id',v_tx.id,'transactionRef',v_tx.transaction_ref,'status',v_tx.status,'amount',v_tx.amount,'fee',v_tx.fee,'commission',v_tx.commission,'reused',false);
  ELSIF p_action='APPROVE_TRANSACTION' THEN
    SELECT * INTO v_tx FROM public.money_agent_transactions WHERE id=(p_payload->>'transactionId')::uuid AND company_id=c FOR UPDATE;
    IF v_tx.id IS NULL OR v_tx.status<>'Awaiting Authorization' THEN RAISE EXCEPTION 'Only an awaiting Money Agent transaction can be approved.' USING ERRCODE='22023'; END IF;
    IF EXISTS (SELECT 1 FROM public.money_agent_approvals WHERE company_id=c AND transaction_id=v_tx.id AND status='Pending' AND requested_by=auth.uid()) THEN RAISE EXCEPTION 'The transaction maker cannot approve their own transaction.' USING ERRCODE='42501'; END IF;
    UPDATE public.money_agent_approvals SET status='Approved',decided_by=auth.uid(),decided_at=v_now,note=nullif(p_payload->>'note','') WHERE company_id=c AND transaction_id=v_tx.id AND status='Pending' RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'The Money Agent approval is no longer pending.' USING ERRCODE='22023'; END IF;
    UPDATE public.money_agent_transactions SET status='Processing',authorized_at=v_now,processed_at=v_now,updated_at=v_now WHERE id=v_tx.id;
    IF v_tx.transaction_type IN ('Cash In','Cash Out') THEN
      SELECT * INTO v_wallet FROM public.money_agent_wallets WHERE company_id=c AND owner_type='Agent' AND owner_id=v_tx.agent_id AND wallet_type=CASE WHEN v_tx.transaction_type='Cash In' THEN 'Float' ELSE 'Cash' END AND status='Active' FOR UPDATE;
      SELECT * INTO v_other_wallet FROM public.money_agent_wallets WHERE company_id=c AND owner_type='Agent' AND owner_id=v_tx.agent_id AND wallet_type=CASE WHEN v_tx.transaction_type='Cash In' THEN 'Cash' ELSE 'Float' END AND status='Active' FOR UPDATE;
      IF v_wallet.id IS NULL OR v_other_wallet.id IS NULL THEN RAISE EXCEPTION 'The agent wallets are not provisioned.' USING ERRCODE='22023'; END IF;
      IF v_wallet.available_balance < v_tx.amount THEN RAISE EXCEPTION 'Insufficient agent balance for this cash transaction.' USING ERRCODE='22003'; END IF;
      IF v_tx.transaction_type='Cash In' THEN UPDATE public.money_agent_wallets SET available_balance=available_balance-v_tx.amount,updated_at=v_now WHERE id=v_wallet.id; UPDATE public.money_agent_wallets SET available_balance=available_balance+v_tx.amount+v_tx.fee,updated_at=v_now WHERE id=v_other_wallet.id; v_entries:=jsonb_build_array(jsonb_build_object('account','AGENT_CASH:'||v_other_wallet.owner_id,'entryType','Debit','amount',v_tx.amount+v_tx.fee),jsonb_build_object('account','AGENT_FLOAT:'||v_wallet.owner_id,'entryType','Credit','amount',v_tx.amount),jsonb_build_object('account','FEE_INCOME','entryType','Credit','amount',v_tx.fee));
      ELSE UPDATE public.money_agent_wallets SET available_balance=available_balance-v_tx.amount,updated_at=v_now WHERE id=v_wallet.id; UPDATE public.money_agent_wallets SET available_balance=available_balance+v_tx.amount+v_tx.fee,updated_at=v_now WHERE id=v_other_wallet.id; v_entries:=jsonb_build_array(jsonb_build_object('account','AGENT_FLOAT:'||v_other_wallet.owner_id,'entryType','Debit','amount',v_tx.amount+v_tx.fee),jsonb_build_object('account','AGENT_CASH:'||v_wallet.owner_id,'entryType','Credit','amount',v_tx.amount),jsonb_build_object('account','FEE_INCOME','entryType','Credit','amount',v_tx.fee)); END IF;
      PERFORM public.money_agent_ledger_post(v_tx.id,v_entries);
      UPDATE public.money_agent_wallets SET available_balance=available_balance+v_tx.commission,updated_at=v_now WHERE company_id=c AND owner_type='Agent' AND owner_id=v_tx.agent_id AND wallet_type='Commission' AND status='Active';
      IF v_tx.commission>0 THEN INSERT INTO public.money_agent_ledger_entries(company_id,transaction_id,account_code,entry_type,amount,metadata) VALUES(c,v_tx.id,'COMMISSION_EXPENSE','Debit',v_tx.commission,'{}'::jsonb),(c,v_tx.id,'COMMISSION_PAYABLE:'||v_tx.agent_id,'Credit',v_tx.commission,'{}'::jsonb); END IF;
      INSERT INTO public.money_agent_daily_summaries(company_id,agent_id,branch_id,business_date,transaction_count,successful_count,failed_count,cash_in_amount,cash_out_amount,fee_amount,commission_amount)
      VALUES(c,v_tx.agent_id,v_tx.branch_id,(v_now AT TIME ZONE 'Africa/Dar_es_Salaam')::date,1,1,0,CASE WHEN v_tx.transaction_type='Cash In' THEN v_tx.amount ELSE 0 END,CASE WHEN v_tx.transaction_type='Cash Out' THEN v_tx.amount ELSE 0 END,v_tx.fee,v_tx.commission)
      ON CONFLICT(company_id,agent_id,business_date) DO UPDATE SET transaction_count=public.money_agent_daily_summaries.transaction_count+1,successful_count=public.money_agent_daily_summaries.successful_count+1,cash_in_amount=public.money_agent_daily_summaries.cash_in_amount+EXCLUDED.cash_in_amount,cash_out_amount=public.money_agent_daily_summaries.cash_out_amount+EXCLUDED.cash_out_amount,fee_amount=public.money_agent_daily_summaries.fee_amount+EXCLUDED.fee_amount,commission_amount=public.money_agent_daily_summaries.commission_amount+EXCLUDED.commission_amount,updated_at=v_now;
      INSERT INTO public.money_agent_receipts(company_id,transaction_id,receipt_number,channel,recipient_phone,metadata)
      VALUES(c,v_tx.id,'MA-RCPT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),'Dashboard',(SELECT phone FROM public.money_agent_customers WHERE id=v_tx.customer_id),jsonb_build_object('transactionRef',v_tx.transaction_ref,'status','Successful')) ON CONFLICT(company_id,transaction_id) DO NOTHING;
      INSERT INTO public.money_agent_notifications(company_id,transaction_id,agent_id,channel,status,title,body)
      VALUES(c,v_tx.id,v_tx.agent_id,'In App','Queued','Money Agent transaction successful','Transaction '||v_tx.transaction_ref||' was completed and recorded in the TZS ledger.');
      UPDATE public.money_agent_transactions SET status='Successful',completed_at=v_now,updated_at=v_now WHERE id=v_tx.id;
      PERFORM public.money_agent_audit('TRANSACTION_APPROVED','Transaction',v_tx.id,NULL,jsonb_build_object('status','Successful'));
      RETURN jsonb_build_object('id',v_tx.id,'transactionRef',v_tx.transaction_ref,'status','Successful','amount',v_tx.amount,'fee',v_tx.fee,'commission',v_tx.commission);
    ELSE
      UPDATE public.money_agent_transactions SET status='Pending Provider',updated_at=v_now WHERE id=v_tx.id;
      PERFORM public.money_agent_audit('TRANSACTION_APPROVED_PENDING_PROVIDER','Transaction',v_tx.id,NULL,jsonb_build_object('status','Pending Provider'));
      RETURN jsonb_build_object('id',v_tx.id,'transactionRef',v_tx.transaction_ref,'status','Pending Provider','providerConfigured',false);
    END IF;
  ELSIF p_action='REJECT_TRANSACTION' THEN
    IF EXISTS(SELECT 1 FROM public.money_agent_approvals WHERE company_id=c AND transaction_id=(p_payload->>'transactionId')::uuid AND requested_by=auth.uid()) THEN RAISE EXCEPTION 'The transaction maker cannot reject their own transaction.' USING ERRCODE='42501'; END IF;
    UPDATE public.money_agent_approvals SET status='Rejected',decided_by=auth.uid(),decided_at=v_now,note=trim(p_payload->>'note') WHERE company_id=c AND transaction_id=(p_payload->>'transactionId')::uuid AND status='Pending' RETURNING transaction_id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'The Money Agent approval is no longer pending.' USING ERRCODE='22023'; END IF;
    UPDATE public.money_agent_transactions SET status='Failed',failure_code='APPROVAL_REJECTED',failure_reason=left(trim(p_payload->>'note'),500),updated_at=v_now WHERE id=v_id AND company_id=c;
    PERFORM public.money_agent_audit('TRANSACTION_REJECTED','Transaction',v_id,NULL,jsonb_build_object('status','Failed','reason',p_payload->>'note'));
    RETURN jsonb_build_object('id',v_id,'status','Failed');
  ELSIF p_action IN ('REVERSE_TRANSACTION','REFUND_TRANSACTION') THEN
    SELECT * INTO v_tx FROM public.money_agent_transactions WHERE id=(p_payload->>'transactionId')::uuid AND company_id=c FOR UPDATE;
    IF v_tx.id IS NULL OR v_tx.status<>'Successful' OR v_tx.transaction_type NOT IN ('Cash In','Cash Out') THEN RAISE EXCEPTION 'Only a successful cash transaction can be reversed or refunded safely.' USING ERRCODE='22023'; END IF;
    IF EXISTS(SELECT 1 FROM public.money_agent_approvals WHERE company_id=c AND transaction_id=v_tx.id AND requested_by=auth.uid()) THEN RAISE EXCEPTION 'The transaction maker cannot reverse or refund their own transaction.' USING ERRCODE='42501'; END IF;
    SELECT * INTO v_wallet FROM public.money_agent_wallets WHERE company_id=c AND owner_type='Agent' AND owner_id=v_tx.agent_id AND wallet_type=CASE WHEN v_tx.transaction_type='Cash In' THEN 'Cash' ELSE 'Float' END AND status='Active' FOR UPDATE;
    SELECT * INTO v_other_wallet FROM public.money_agent_wallets WHERE company_id=c AND owner_type='Agent' AND owner_id=v_tx.agent_id AND wallet_type=CASE WHEN v_tx.transaction_type='Cash In' THEN 'Float' ELSE 'Cash' END AND status='Active' FOR UPDATE;
    IF v_wallet.available_balance < v_tx.amount+v_tx.fee THEN RAISE EXCEPTION 'The agent balance cannot support this reversal.' USING ERRCODE='22003'; END IF;
    UPDATE public.money_agent_wallets SET available_balance=available_balance-v_tx.amount-v_tx.fee,updated_at=v_now WHERE id=v_wallet.id;
    UPDATE public.money_agent_wallets SET available_balance=available_balance+v_tx.amount,updated_at=v_now WHERE id=v_other_wallet.id;
    v_entries:=CASE WHEN v_tx.transaction_type='Cash In' THEN jsonb_build_array(jsonb_build_object('account','AGENT_FLOAT:'||v_other_wallet.owner_id,'entryType','Debit','amount',v_tx.amount),jsonb_build_object('account','AGENT_CASH:'||v_wallet.owner_id,'entryType','Credit','amount',v_tx.amount+v_tx.fee),jsonb_build_object('account','FEE_INCOME','entryType','Debit','amount',v_tx.fee)) ELSE jsonb_build_array(jsonb_build_object('account','AGENT_FLOAT:'||v_wallet.owner_id,'entryType','Credit','amount',v_tx.amount+v_tx.fee),jsonb_build_object('account','AGENT_CASH:'||v_other_wallet.owner_id,'entryType','Debit','amount',v_tx.amount),jsonb_build_object('account','FEE_INCOME','entryType','Debit','amount',v_tx.fee)) END;
    PERFORM public.money_agent_ledger_post(v_tx.id,v_entries);
    UPDATE public.money_agent_transactions SET status=CASE WHEN p_action='REVERSE_TRANSACTION' THEN 'Reversed' ELSE 'Refunded' END,reversed_at=v_now,updated_at=v_now WHERE id=v_tx.id;
    PERFORM public.money_agent_audit(p_action,'Transaction',v_tx.id,NULL,jsonb_build_object('status',CASE WHEN p_action='REVERSE_TRANSACTION' THEN 'Reversed' ELSE 'Refunded' END));
    RETURN jsonb_build_object('id',v_tx.id,'status',CASE WHEN p_action='REVERSE_TRANSACTION' THEN 'Reversed' ELSE 'Refunded' END);
  ELSIF p_action='SETTLE_DAY' THEN
    v_agent:=(p_payload->>'agentId')::uuid; v_business_date:=(p_payload->>'businessDate')::date;
    SELECT available_balance INTO v_amount FROM public.money_agent_wallets WHERE company_id=c AND owner_type='Agent' AND owner_id=v_agent AND wallet_type='Float' AND status='Active';
    IF v_amount IS NULL THEN RAISE EXCEPTION 'The selected agent float wallet is unavailable.' USING ERRCODE='22023'; END IF;
    INSERT INTO public.money_agent_settlements(company_id,agent_id,branch_id,business_date,opening_float,closing_float,expected_float,variance,status,submitted_by,notes)
    VALUES(c,v_agent,(SELECT branch_id FROM public.money_agent_agents WHERE id=v_agent),v_business_date,coalesce(nullif(p_payload->>'openingFloat','')::numeric,0),coalesce(nullif(p_payload->>'closingFloat','')::numeric,v_amount),v_amount,coalesce(nullif(p_payload->>'closingFloat','')::numeric,v_amount)-v_amount,CASE WHEN coalesce(nullif(p_payload->>'closingFloat','')::numeric,v_amount)=v_amount THEN 'Settled' ELSE 'Variance Review' END,auth.uid(),nullif(p_payload->>'notes','')) ON CONFLICT(company_id,agent_id,business_date) DO UPDATE SET closing_float=EXCLUDED.closing_float,expected_float=EXCLUDED.expected_float,variance=EXCLUDED.variance,status=EXCLUDED.status,submitted_by=EXCLUDED.submitted_by,updated_at=v_now RETURNING id INTO v_id;
    INSERT INTO public.money_agent_reconciliations(company_id,settlement_id,status,expected_amount,actual_amount,variance,reviewed_by,reviewed_at,notes) VALUES(c,v_id,CASE WHEN (SELECT variance FROM public.money_agent_settlements WHERE id=v_id)=0 THEN 'Matched' ELSE 'Variance' END,(SELECT expected_float FROM public.money_agent_settlements WHERE id=v_id),(SELECT closing_float FROM public.money_agent_settlements WHERE id=v_id),(SELECT variance FROM public.money_agent_settlements WHERE id=v_id),NULL,NULL,nullif(p_payload->>'notes','')) ON CONFLICT(company_id,settlement_id) DO UPDATE SET actual_amount=EXCLUDED.actual_amount,variance=EXCLUDED.variance,status=EXCLUDED.status,updated_at=v_now;
    PERFORM public.money_agent_audit('DAY_SETTLED','Settlement',v_id,NULL,p_payload);
    RETURN jsonb_build_object('id',v_id,'status',(SELECT status FROM public.money_agent_settlements WHERE id=v_id),'variance',(SELECT variance FROM public.money_agent_settlements WHERE id=v_id));
  ELSIF p_action='ACK_ALERT' THEN
    UPDATE public.money_agent_alerts SET status='Acknowledged',acknowledged_by=auth.uid(),acknowledged_at=v_now WHERE id=(p_payload->>'alertId')::uuid AND company_id=c AND status='Open' RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'The Money Agent alert is no longer open.' USING ERRCODE='22023'; END IF;
    RETURN jsonb_build_object('id',v_id,'status','Acknowledged');
  ELSIF p_action='REVIEW_RECONCILIATION' THEN
    UPDATE public.money_agent_reconciliations SET status=coalesce(p_payload->>'status','Approved'),reviewed_by=auth.uid(),reviewed_at=v_now,notes=coalesce(nullif(p_payload->>'notes',''),notes),updated_at=v_now WHERE id=(p_payload->>'reconciliationId')::uuid AND company_id=c AND status IN ('Matched','Variance') RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'The reconciliation is not available for review.' USING ERRCODE='22023'; END IF;
    PERFORM public.money_agent_audit('RECONCILIATION_REVIEWED','Reconciliation',v_id,NULL,p_payload);
    RETURN jsonb_build_object('id',v_id,'status',coalesce(p_payload->>'status','Approved'));
  END IF;
  RAISE EXCEPTION 'Money Agent action did not return a result.' USING ERRCODE='22023';
END; $$;

ALTER TABLE public.money_agent_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_pin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.money_agent_daily_summaries ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['money_agent_branches','money_agent_agents','money_agent_customers','money_agent_wallets','money_agent_services','money_agent_fee_rules','money_agent_commission_rules','money_agent_limits','money_agent_transactions','money_agent_ledger_entries','money_agent_approvals','money_agent_settlements','money_agent_reconciliations','money_agent_alerts','money_agent_audit_events','money_agent_receipts','money_agent_notifications','money_agent_risk_events','money_agent_daily_summaries'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_tenant_read',t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id=public.current_company_id() AND public.money_agent_can_view())',t||'_tenant_read',t);
  END LOOP;
END $$;

REVOKE ALL ON TABLE public.money_agent_branches, public.money_agent_agents, public.money_agent_customers, public.money_agent_wallets, public.money_agent_services, public.money_agent_fee_rules, public.money_agent_commission_rules, public.money_agent_limits, public.money_agent_transactions, public.money_agent_ledger_entries, public.money_agent_approvals, public.money_agent_settlements, public.money_agent_reconciliations, public.money_agent_alerts, public.money_agent_audit_events, public.money_agent_pin_credentials, public.money_agent_receipts, public.money_agent_notifications, public.money_agent_risk_events, public.money_agent_daily_summaries FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_snapshot(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.money_agent_customer_snapshot(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.money_agent_action(text,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.money_agent_has_role(text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_can_view() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_can_customer_portal() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_can_operate() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_can_manage() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_can_approve() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_can_audit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_require(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_audit(text,text,uuid,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.money_agent_ledger_post(uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.money_agent_branches, public.money_agent_agents, public.money_agent_customers, public.money_agent_wallets, public.money_agent_services, public.money_agent_fee_rules, public.money_agent_commission_rules, public.money_agent_limits, public.money_agent_transactions, public.money_agent_ledger_entries, public.money_agent_approvals, public.money_agent_settlements, public.money_agent_reconciliations, public.money_agent_alerts, public.money_agent_audit_events, public.money_agent_receipts, public.money_agent_notifications, public.money_agent_risk_events, public.money_agent_daily_summaries TO authenticated;
GRANT EXECUTE ON FUNCTION public.money_agent_can_view() TO authenticated;
GRANT EXECUTE ON FUNCTION public.money_agent_can_customer_portal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.money_agent_customer_snapshot(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.money_agent_action(text,jsonb) TO authenticated;

COMMIT;
