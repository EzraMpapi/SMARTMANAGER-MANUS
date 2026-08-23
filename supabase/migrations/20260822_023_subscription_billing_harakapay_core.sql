-- Smart Manager Subscription & Billing Core
-- Additive tenant-scoped billing model. Provider secrets remain server-side only.

BEGIN;

CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Archived')),
  currency text NOT NULL DEFAULT 'TZS',
  monthly_price numeric(18,2),
  annual_price numeric(18,2),
  annual_savings_label text,
  included_users integer,
  included_branches integer,
  included_storage_mb bigint,
  included_transactions integer,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  module_entitlements jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  recommended boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_plans_price_check CHECK (
    (monthly_price IS NULL OR monthly_price >= 0)
    AND (annual_price IS NULL OR annual_price >= 0)
  ),
  CONSTRAINT billing_plans_scope_code_unique UNIQUE NULLS NOT DISTINCT (company_id, code)
);

CREATE TABLE IF NOT EXISTS public.billing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  legal_name text,
  contact_name text,
  email text,
  phone text,
  tax_identifier text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.billing_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Trial', 'Pending', 'Active', 'Grace', 'Expired', 'Cancelled', 'Superseded')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('Monthly', 'Annual')),
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'TZS',
  started_at timestamptz,
  renewed_at timestamptz,
  expires_at timestamptz,
  grace_expires_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  source_payment_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.tenant_subscriptions(id) ON DELETE SET NULL,
  plan_id uuid NOT NULL REFERENCES public.billing_plans(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'HarakaPay',
  internal_reference text NOT NULL,
  idempotency_key text NOT NULL,
  provider_order_id text,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  fee numeric(18,2),
  net_amount numeric(18,2),
  currency text NOT NULL DEFAULT 'TZS',
  phone text NOT NULL,
  description text,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('Monthly', 'Annual')),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed', 'Cancelled', 'VerificationRequired')),
  initiated_by uuid,
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  paid_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_payments_reference_unique UNIQUE (internal_reference),
  CONSTRAINT subscription_payments_idempotency_unique UNIQUE (company_id, idempotency_key),
  CONSTRAINT subscription_payments_provider_order_unique UNIQUE (provider, provider_order_id)
);

ALTER TABLE public.tenant_subscriptions
  ADD CONSTRAINT tenant_subscriptions_source_payment_fk
  FOREIGN KEY (source_payment_id) REFERENCES public.subscription_payments(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.tenant_subscriptions(id) ON DELETE RESTRICT,
  payment_id uuid REFERENCES public.subscription_payments(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'Issued' CHECK (status IN ('Draft', 'Issued', 'Paid', 'Void')),
  currency text NOT NULL DEFAULT 'TZS',
  subtotal numeric(18,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  paid_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  paid_at timestamptz,
  document_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, invoice_number),
  UNIQUE(payment_id)
);

CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  usage_key text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  usage_value numeric(20,2) NOT NULL DEFAULT 0 CHECK (usage_value >= 0),
  limit_value numeric(20,2),
  source text NOT NULL DEFAULT 'System',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, usage_key, period_start, period_end),
  CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.tenant_subscriptions(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.subscription_payments(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  previous_status text,
  new_status text,
  actor_profile_id uuid,
  actor_type text NOT NULL DEFAULT 'system',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_plans_active_idx ON public.billing_plans(status, company_id, sort_order);
CREATE INDEX IF NOT EXISTS billing_profiles_company_idx ON public.billing_profiles(company_id);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_company_status_idx ON public.tenant_subscriptions(company_id, status, expires_at DESC);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_plan_idx ON public.tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_source_payment_idx ON public.tenant_subscriptions(source_payment_id);
CREATE INDEX IF NOT EXISTS subscription_payments_company_status_idx ON public.subscription_payments(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_payments_subscription_idx ON public.subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_payments_plan_idx ON public.subscription_payments(plan_id);
CREATE INDEX IF NOT EXISTS subscription_payments_provider_order_idx ON public.subscription_payments(provider, provider_order_id);
CREATE INDEX IF NOT EXISTS subscription_invoices_company_issued_idx ON public.subscription_invoices(company_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS subscription_invoices_subscription_idx ON public.subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_events_company_created_idx ON public.subscription_events(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_events_subscription_idx ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_events_payment_idx ON public.subscription_events(payment_id);
CREATE INDEX IF NOT EXISTS subscription_usage_company_key_idx ON public.subscription_usage(company_id, usage_key, period_start DESC);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_payments_one_pending_per_company_idx
  ON public.subscription_payments(company_id)
  WHERE status = 'Pending';

CREATE OR REPLACE FUNCTION public.billing_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billing_plans_touch_updated_at ON public.billing_plans;
CREATE TRIGGER billing_plans_touch_updated_at BEFORE UPDATE ON public.billing_plans FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();
DROP TRIGGER IF EXISTS billing_profiles_touch_updated_at ON public.billing_profiles;
CREATE TRIGGER billing_profiles_touch_updated_at BEFORE UPDATE ON public.billing_profiles FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();
DROP TRIGGER IF EXISTS tenant_subscriptions_touch_updated_at ON public.tenant_subscriptions;
CREATE TRIGGER tenant_subscriptions_touch_updated_at BEFORE UPDATE ON public.tenant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();
DROP TRIGGER IF EXISTS subscription_payments_touch_updated_at ON public.subscription_payments;
CREATE TRIGGER subscription_payments_touch_updated_at BEFORE UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();
DROP TRIGGER IF EXISTS subscription_invoices_touch_updated_at ON public.subscription_invoices;
CREATE TRIGGER subscription_invoices_touch_updated_at BEFORE UPDATE ON public.subscription_invoices FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();

CREATE OR REPLACE FUNCTION public.billing_is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = public.current_company_id()
      AND lower(coalesce(p.role, '')) IN ('super administrator', 'organization owner', 'owner', 'ceo', 'cfo', 'finance manager', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM public.company_memberships m
    WHERE m.user_id = auth.uid()
      AND m.company_id = public.current_company_id()
      AND lower(coalesce(m.role, '')) IN ('super administrator', 'organization owner', 'owner', 'ceo', 'cfo', 'finance manager', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.billing_require_manager()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'An authenticated workspace session is required for billing.' USING ERRCODE = '28000';
  END IF;
  IF NOT public.billing_is_manager() THEN
    RAISE EXCEPTION 'Only authorized billing administrators can manage subscriptions and payments.' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_audit(
  p_action text,
  p_subject text,
  p_subscription_id uuid DEFAULT NULL,
  p_payment_id uuid DEFAULT NULL,
  p_previous_status text DEFAULT NULL,
  p_new_status text DEFAULT NULL,
  p_detail jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor text;
  v_company_id uuid := coalesce(
    (SELECT company_id FROM public.subscription_payments WHERE id = p_payment_id),
    (SELECT company_id FROM public.tenant_subscriptions WHERE id = p_subscription_id),
    public.current_company_id()
  );
BEGIN
  SELECT coalesce(full_name, email, 'System') INTO v_actor FROM public.profiles WHERE id = auth.uid();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Billing audit could not determine the workspace context.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.subscription_events(company_id, subscription_id, payment_id, event_type, previous_status, new_status, actor_profile_id, actor_type, details)
  VALUES (v_company_id, p_subscription_id, p_payment_id, p_action, p_previous_status, p_new_status, auth.uid(), CASE WHEN auth.uid() IS NULL THEN 'service' ELSE 'user' END, coalesce(p_detail, '{}'::jsonb));
  INSERT INTO public.audit_log(company_id, action, module, actor, subject, details, detail)
  VALUES (v_company_id, p_action, 'Subscription Billing', coalesce(v_actor, 'System'), p_subject, coalesce(p_detail::text, '{}'), coalesce(p_detail, '{}'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
BEGIN
  PERFORM public.billing_require_manager();
  RETURN jsonb_build_object(
    'companyId', v_company_id,
    'viewer', jsonb_build_object('profileId', auth.uid(), 'canManageBilling', true),
    'profile', coalesce((SELECT to_jsonb(p) FROM public.billing_profiles p WHERE p.company_id = v_company_id), '{}'::jsonb),
    'plans', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.recommended DESC, p.sort_order, p.name) FROM public.billing_plans p WHERE p.company_id IS NULL OR p.company_id = v_company_id), '[]'::jsonb),
    'subscription', coalesce((SELECT to_jsonb(s) FROM public.tenant_subscriptions s WHERE s.company_id = v_company_id AND s.status IN ('Trial', 'Pending', 'Active', 'Grace', 'Expired') ORDER BY s.created_at DESC LIMIT 1), '{}'::jsonb),
    'payments', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM (SELECT * FROM public.subscription_payments WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) p), '[]'::jsonb),
    'invoices', coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.issued_at DESC) FROM (SELECT * FROM public.subscription_invoices WHERE company_id = v_company_id ORDER BY issued_at DESC LIMIT 100) i), '[]'::jsonb),
    'events', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC) FROM (SELECT * FROM public.subscription_events WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) e), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_upsert_profile(p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_row public.billing_profiles%ROWTYPE;
BEGIN
  PERFORM public.billing_require_manager();
  INSERT INTO public.billing_profiles(company_id, legal_name, contact_name, email, phone, tax_identifier, address, notes)
  VALUES (
    public.current_company_id(),
    nullif(trim(p_payload->>'legalName'), ''),
    nullif(trim(p_payload->>'contactName'), ''),
    nullif(trim(lower(p_payload->>'email')), ''),
    nullif(trim(p_payload->>'phone'), ''),
    nullif(trim(p_payload->>'taxIdentifier'), ''),
    coalesce(p_payload->'address', '{}'::jsonb),
    nullif(trim(p_payload->>'notes'), '')
  )
  ON CONFLICT (company_id) DO UPDATE SET
    legal_name = EXCLUDED.legal_name, contact_name = EXCLUDED.contact_name, email = EXCLUDED.email,
    phone = EXCLUDED.phone, tax_identifier = EXCLUDED.tax_identifier, address = EXCLUDED.address, notes = EXCLUDED.notes
  RETURNING * INTO v_row;
  PERFORM public.billing_audit('BILLING_PROFILE_UPDATED', v_row.id::text, NULL, NULL, NULL, NULL, jsonb_build_object('profileId', v_row.id));
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_upsert_plan(p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_plan public.billing_plans%ROWTYPE;
  v_plan_id uuid := nullif(p_payload->>'planId', '')::uuid;
  v_code text := upper(regexp_replace(coalesce(trim(p_payload->>'code'), ''), '[^A-Za-z0-9_-]', '-', 'g'));
  v_status text := coalesce(nullif(trim(p_payload->>'status'), ''), 'Draft');
BEGIN
  PERFORM public.billing_require_manager();
  IF nullif(trim(p_payload->>'name'), '') IS NULL OR v_code = '' THEN
    RAISE EXCEPTION 'A plan name and code are required.' USING ERRCODE = '22023';
  END IF;
  IF v_status NOT IN ('Draft', 'Active', 'Archived') THEN
    RAISE EXCEPTION 'Plan status must be Draft, Active, or Archived.' USING ERRCODE = '22023';
  END IF;
  IF v_plan_id IS NULL THEN
    INSERT INTO public.billing_plans(company_id, code, name, description, status, currency, monthly_price, annual_price, annual_savings_label, included_users, included_branches, included_storage_mb, included_transactions, features, module_entitlements, sort_order, recommended, created_by)
    VALUES (public.current_company_id(), v_code, trim(p_payload->>'name'), nullif(trim(p_payload->>'description'), ''), v_status, coalesce(nullif(trim(p_payload->>'currency'), ''), 'TZS'), nullif(p_payload->>'monthlyPrice', '')::numeric, nullif(p_payload->>'annualPrice', '')::numeric, nullif(trim(p_payload->>'annualSavingsLabel'), ''), nullif(p_payload->>'includedUsers', '')::integer, nullif(p_payload->>'includedBranches', '')::integer, nullif(p_payload->>'includedStorageMb', '')::bigint, nullif(p_payload->>'includedTransactions', '')::integer, coalesce(p_payload->'features', '{}'::jsonb), coalesce(p_payload->'moduleEntitlements', '[]'::jsonb), coalesce(nullif(p_payload->>'sortOrder', '')::integer, 0), coalesce((p_payload->>'recommended')::boolean, false), auth.uid())
    RETURNING * INTO v_plan;
  ELSE
    UPDATE public.billing_plans
    SET code = v_code, name = trim(p_payload->>'name'), description = nullif(trim(p_payload->>'description'), ''), status = v_status,
        currency = coalesce(nullif(trim(p_payload->>'currency'), ''), currency), monthly_price = nullif(p_payload->>'monthlyPrice', '')::numeric,
        annual_price = nullif(p_payload->>'annualPrice', '')::numeric, annual_savings_label = nullif(trim(p_payload->>'annualSavingsLabel'), ''),
        included_users = nullif(p_payload->>'includedUsers', '')::integer, included_branches = nullif(p_payload->>'includedBranches', '')::integer,
        included_storage_mb = nullif(p_payload->>'includedStorageMb', '')::bigint, included_transactions = nullif(p_payload->>'includedTransactions', '')::integer,
        features = coalesce(p_payload->'features', features), module_entitlements = coalesce(p_payload->'moduleEntitlements', module_entitlements),
        sort_order = coalesce(nullif(p_payload->>'sortOrder', '')::integer, sort_order), recommended = coalesce((p_payload->>'recommended')::boolean, recommended)
    WHERE id = v_plan_id AND company_id = public.current_company_id()
    RETURNING * INTO v_plan;
    IF NOT FOUND THEN RAISE EXCEPTION 'The billing plan was not found in this workspace.' USING ERRCODE = 'P0002'; END IF;
  END IF;
  PERFORM public.billing_audit('BILLING_PLAN_SAVED', v_plan.id::text, NULL, NULL, NULL, v_plan.status, jsonb_build_object('planCode', v_plan.code, 'planName', v_plan.name));
  RETURN to_jsonb(v_plan);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_create_payment_intent(
  p_plan_id uuid,
  p_billing_cycle text,
  p_phone text,
  p_description text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_plan public.billing_plans%ROWTYPE;
  v_payment public.subscription_payments%ROWTYPE;
  v_phone text;
  v_amount numeric(18,2);
  v_key text := coalesce(nullif(trim(p_idempotency_key), ''), 'SM-SUB-' || replace(gen_random_uuid()::text, '-', ''));
  v_reference text;
BEGIN
  PERFORM public.billing_require_manager();
  IF p_billing_cycle NOT IN ('Monthly', 'Annual') THEN
    RAISE EXCEPTION 'Billing cycle must be Monthly or Annual.' USING ERRCODE = '22023';
  END IF;
  v_phone := regexp_replace(coalesce(trim(p_phone), ''), '[^0-9+]', '', 'g');
  IF v_phone !~ '^(?:\\+?255|0)[67][0-9]{8}$' THEN
    RAISE EXCEPTION 'Enter a valid Tanzanian mobile number.' USING ERRCODE = '22023';
  END IF;
  IF left(v_phone, 1) = '0' THEN v_phone := '255' || substr(v_phone, 2); END IF;
  IF left(v_phone, 1) = '+' THEN v_phone := substr(v_phone, 2); END IF;

  SELECT * INTO v_plan FROM public.billing_plans
  WHERE id = p_plan_id AND status = 'Active' AND (company_id IS NULL OR company_id = public.current_company_id());
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected billing plan is unavailable to this workspace.' USING ERRCODE = 'P0002'; END IF;
  v_amount := CASE WHEN p_billing_cycle = 'Annual' THEN v_plan.annual_price ELSE v_plan.monthly_price END;
  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'This plan does not have a valid configured price for the selected billing cycle.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_payment FROM public.subscription_payments
  WHERE company_id = public.current_company_id() AND idempotency_key = v_key LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('paymentId', v_payment.id, 'reference', v_payment.internal_reference, 'amount', v_payment.amount, 'currency', v_payment.currency, 'phone', v_payment.phone, 'status', v_payment.status, 'reused', true);
  END IF;
  IF EXISTS (SELECT 1 FROM public.subscription_payments WHERE company_id = public.current_company_id() AND status = 'Pending') THEN
    RAISE EXCEPTION 'A payment request is already pending for this workspace. Verify or cancel it before starting another request.' USING ERRCODE = '23505';
  END IF;
  v_reference := 'SM-SUB-' || replace(public.current_company_id()::text, '-', '') || '-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  INSERT INTO public.subscription_payments(company_id, plan_id, provider, internal_reference, idempotency_key, amount, currency, phone, description, billing_cycle, status, initiated_by, provider_response)
  VALUES (public.current_company_id(), v_plan.id, 'HarakaPay', v_reference, v_key, v_amount, v_plan.currency, v_phone, nullif(trim(p_description), ''), p_billing_cycle, 'Pending', auth.uid(), jsonb_build_object('planCode', v_plan.code, 'planName', v_plan.name))
  RETURNING * INTO v_payment;
  PERFORM public.billing_audit('SUBSCRIPTION_PAYMENT_INITIATED', v_payment.internal_reference, NULL, v_payment.id, NULL, 'Pending', jsonb_build_object('planId', v_plan.id, 'cycle', p_billing_cycle, 'amount', v_payment.amount, 'currency', v_payment.currency));
  RETURN jsonb_build_object('paymentId', v_payment.id, 'reference', v_payment.internal_reference, 'amount', v_payment.amount, 'currency', v_payment.currency, 'phone', v_payment.phone, 'status', v_payment.status, 'planName', v_plan.name, 'reused', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_record_provider_dispatch(
  p_payment_id uuid,
  p_provider_order_id text,
  p_provider_response jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_payment public.subscription_payments%ROWTYPE;
BEGIN
  SELECT * INTO v_payment FROM public.subscription_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription payment was not found.' USING ERRCODE = 'P0002'; END IF;
  IF v_payment.status <> 'Pending' THEN RETURN to_jsonb(v_payment); END IF;
  IF nullif(trim(p_provider_order_id), '') IS NULL THEN RAISE EXCEPTION 'Provider order ID is required.' USING ERRCODE = '22023'; END IF;
  UPDATE public.subscription_payments SET provider_order_id = trim(p_provider_order_id), provider_response = coalesce(p_provider_response, '{}'::jsonb), updated_at = now()
  WHERE id = v_payment.id RETURNING * INTO v_payment;
  PERFORM public.billing_audit('HARAKAPAY_USSD_DISPATCHED', v_payment.internal_reference, NULL, v_payment.id, 'Pending', 'Pending', jsonb_build_object('providerOrderId', v_payment.provider_order_id));
  RETURN to_jsonb(v_payment);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_mark_payment_dispatch_failure(
  p_payment_id uuid,
  p_failure_reason text,
  p_provider_response jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE v_payment public.subscription_payments%ROWTYPE;
BEGIN
  SELECT * INTO v_payment FROM public.subscription_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription payment was not found.' USING ERRCODE = 'P0002'; END IF;
  IF v_payment.status <> 'Pending' THEN RETURN to_jsonb(v_payment); END IF;
  UPDATE public.subscription_payments
  SET status = 'Failed', failure_reason = left(coalesce(nullif(trim(p_failure_reason), ''), 'The payment provider could not accept this request.'), 500), provider_response = coalesce(p_provider_response, '{}'::jsonb), verified_at = now()
  WHERE id = v_payment.id
  RETURNING * INTO v_payment;
  PERFORM public.billing_audit('HARAKAPAY_DISPATCH_FAILED', v_payment.internal_reference, NULL, v_payment.id, 'Pending', 'Failed', jsonb_build_object('provider', v_payment.provider));
  RETURN to_jsonb(v_payment);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_apply_provider_status(
  p_payment_id uuid,
  p_provider_order_id text,
  p_provider_status text,
  p_provider_response jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_payment public.subscription_payments%ROWTYPE;
  v_plan public.billing_plans%ROWTYPE;
  v_subscription public.tenant_subscriptions%ROWTYPE;
  v_invoice public.subscription_invoices%ROWTYPE;
  v_normalized_status text := lower(trim(coalesce(p_provider_status, '')));
  v_previous_status text;
  v_provider_amount numeric(18,2);
  v_period_end timestamptz;
BEGIN
  SELECT * INTO v_payment FROM public.subscription_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscription payment was not found.' USING ERRCODE = 'P0002'; END IF;
  IF v_payment.provider_order_id IS NULL OR v_payment.provider_order_id <> nullif(trim(p_provider_order_id), '') THEN
    RAISE EXCEPTION 'Provider order verification failed.' USING ERRCODE = '42501';
  END IF;
  IF v_payment.status = 'Completed' THEN RETURN jsonb_build_object('payment', to_jsonb(v_payment), 'idempotent', true); END IF;
  IF p_provider_response ? 'amount' AND nullif(p_provider_response->>'amount', '') IS NOT NULL THEN
    v_provider_amount := (p_provider_response->>'amount')::numeric;
    IF v_provider_amount <> v_payment.amount THEN
      UPDATE public.subscription_payments SET status = 'VerificationRequired', failure_reason = 'Provider amount did not match the expected subscription amount.', provider_response = coalesce(p_provider_response, '{}'::jsonb)
      WHERE id = v_payment.id RETURNING * INTO v_payment;
      PERFORM public.billing_audit('SUBSCRIPTION_PAYMENT_AMOUNT_MISMATCH', v_payment.internal_reference, NULL, v_payment.id, 'Pending', 'VerificationRequired', jsonb_build_object('expectedAmount', v_payment.amount, 'providerAmount', v_provider_amount));
      RETURN jsonb_build_object('payment', to_jsonb(v_payment), 'idempotent', false);
    END IF;
  END IF;
  v_previous_status := v_payment.status;
  IF v_normalized_status IN ('completed', 'success', 'successful', 'paid') THEN
    SELECT * INTO v_plan FROM public.billing_plans WHERE id = v_payment.plan_id;
    v_period_end := CASE WHEN v_payment.billing_cycle = 'Annual' THEN now() + interval '1 year' ELSE now() + interval '1 month' END;
    UPDATE public.tenant_subscriptions SET status = 'Superseded', updated_at = now()
    WHERE company_id = v_payment.company_id AND status IN ('Trial', 'Pending', 'Active', 'Grace', 'Expired');
    INSERT INTO public.tenant_subscriptions(company_id, plan_id, status, billing_cycle, amount, currency, started_at, renewed_at, expires_at, source_payment_id, metadata)
    VALUES (v_payment.company_id, v_payment.plan_id, 'Active', v_payment.billing_cycle, v_payment.amount, v_payment.currency, now(), now(), v_period_end, v_payment.id, jsonb_build_object('provider', v_payment.provider, 'providerOrderId', v_payment.provider_order_id))
    RETURNING * INTO v_subscription;
    UPDATE public.subscription_payments SET subscription_id = v_subscription.id, status = 'Completed', fee = nullif(p_provider_response->>'fee', '')::numeric, net_amount = nullif(p_provider_response->>'net_amount', '')::numeric, provider_response = coalesce(p_provider_response, '{}'::jsonb), verified_at = now(), paid_at = now(), failure_reason = NULL
    WHERE id = v_payment.id RETURNING * INTO v_payment;
    INSERT INTO public.subscription_invoices(company_id, subscription_id, payment_id, invoice_number, status, currency, subtotal, total_amount, paid_amount, paid_at, document_data)
    VALUES (v_payment.company_id, v_subscription.id, v_payment.id, 'SM-INV-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(v_payment.id::text, '-', ''), 1, 8)), 'Paid', v_payment.currency, v_payment.amount, v_payment.amount, v_payment.amount, now(), jsonb_build_object('provider', v_payment.provider, 'providerOrderId', v_payment.provider_order_id, 'planName', v_plan.name, 'billingCycle', v_payment.billing_cycle, 'subscriptionExpiresAt', v_subscription.expires_at))
    RETURNING * INTO v_invoice;
    PERFORM public.billing_audit('SUBSCRIPTION_PAYMENT_COMPLETED', v_payment.internal_reference, v_subscription.id, v_payment.id, v_previous_status, 'Completed', jsonb_build_object('invoiceId', v_invoice.id, 'providerOrderId', v_payment.provider_order_id, 'expiresAt', v_subscription.expires_at));
  ELSIF v_normalized_status IN ('failed', 'failure', 'cancelled', 'canceled', 'declined') THEN
    UPDATE public.subscription_payments SET status = CASE WHEN v_normalized_status IN ('cancelled', 'canceled') THEN 'Cancelled' ELSE 'Failed' END, provider_response = coalesce(p_provider_response, '{}'::jsonb), verified_at = now(), failure_reason = coalesce(nullif(p_provider_response->>'message', ''), 'Provider reported that the payment was not completed.')
    WHERE id = v_payment.id RETURNING * INTO v_payment;
    PERFORM public.billing_audit('SUBSCRIPTION_PAYMENT_FAILED', v_payment.internal_reference, NULL, v_payment.id, v_previous_status, v_payment.status, jsonb_build_object('providerOrderId', v_payment.provider_order_id));
  ELSE
    UPDATE public.subscription_payments SET status = 'Pending', provider_response = coalesce(p_provider_response, '{}'::jsonb), verified_at = now()
    WHERE id = v_payment.id RETURNING * INTO v_payment;
  END IF;
  RETURN jsonb_build_object('payment', to_jsonb(v_payment), 'subscription', coalesce(to_jsonb(v_subscription), '{}'::jsonb), 'invoice', coalesce(to_jsonb(v_invoice), '{}'::jsonb), 'idempotent', false);
END;
$$;

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS billing_plans_read ON public.billing_plans;
CREATE POLICY billing_plans_read ON public.billing_plans FOR SELECT TO authenticated
USING (status = 'Active' AND (company_id IS NULL OR company_id = public.current_company_id()));

DROP POLICY IF EXISTS billing_profiles_read ON public.billing_profiles;
CREATE POLICY billing_profiles_read ON public.billing_profiles FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.billing_is_manager());
DROP POLICY IF EXISTS tenant_subscriptions_read ON public.tenant_subscriptions;
CREATE POLICY tenant_subscriptions_read ON public.tenant_subscriptions FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.billing_is_manager());
DROP POLICY IF EXISTS subscription_payments_read ON public.subscription_payments;
CREATE POLICY subscription_payments_read ON public.subscription_payments FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.billing_is_manager());
DROP POLICY IF EXISTS subscription_invoices_read ON public.subscription_invoices;
CREATE POLICY subscription_invoices_read ON public.subscription_invoices FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.billing_is_manager());
DROP POLICY IF EXISTS subscription_usage_read ON public.subscription_usage;
CREATE POLICY subscription_usage_read ON public.subscription_usage FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.billing_is_manager());
DROP POLICY IF EXISTS subscription_events_read ON public.subscription_events;
CREATE POLICY subscription_events_read ON public.subscription_events FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.billing_is_manager());

REVOKE ALL ON FUNCTION public.billing_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_upsert_profile(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_upsert_plan(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_create_payment_intent(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_record_provider_dispatch(uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_mark_payment_dispatch_failure(uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_apply_provider_status(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.billing_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_upsert_profile(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_upsert_plan(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_create_payment_intent(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_record_provider_dispatch(uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.billing_mark_payment_dispatch_failure(uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.billing_apply_provider_status(uuid, text, text, jsonb) TO service_role;

COMMIT;
