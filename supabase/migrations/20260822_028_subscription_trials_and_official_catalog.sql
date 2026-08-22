-- Official Smart Manager plan catalog and one-time 30-day trial lifecycle.
-- Prices are stored in the database; no client-side plan pricing is authoritative.

BEGIN;

ALTER TABLE public.billing_plans
  ADD COLUMN IF NOT EXISTS plan_category text NOT NULL DEFAULT 'Business',
  ADD COLUMN IF NOT EXISTS badge text,
  ADD COLUMN IF NOT EXISTS visual_theme text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 30;

ALTER TABLE public.billing_plans
  DROP CONSTRAINT IF EXISTS billing_plans_category_check,
  ADD CONSTRAINT billing_plans_category_check CHECK (plan_category IN ('Business', 'Football'));

ALTER TABLE public.billing_plans
  DROP CONSTRAINT IF EXISTS billing_plans_trial_days_check,
  ADD CONSTRAINT billing_plans_trial_days_check CHECK (trial_days BETWEEN 0 AND 90);

ALTER TABLE public.tenant_subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

CREATE TABLE IF NOT EXISTS public.billing_plan_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.billing_plans(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  action text NOT NULL,
  changed_by uuid,
  source text NOT NULL DEFAULT 'database',
  previous_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.tenant_subscriptions(id) ON DELETE CASCADE,
  notification_key text NOT NULL,
  notification_type text NOT NULL DEFAULT 'InApp',
  title text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'Unread' CHECK (status IN ('Unread', 'Read')),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, notification_key)
);

CREATE INDEX IF NOT EXISTS billing_plans_catalog_idx
  ON public.billing_plans(plan_category, status, sort_order, code);
CREATE INDEX IF NOT EXISTS tenant_subscriptions_trial_ends_idx
  ON public.tenant_subscriptions(trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tenant_subscriptions_one_trial_per_company_idx
  ON public.tenant_subscriptions(company_id)
  WHERE trial_started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS subscription_notifications_company_created_idx
  ON public.subscription_notifications(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS billing_plan_audit_log_plan_created_idx
  ON public.billing_plan_audit_log(plan_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.billing_audit_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
DECLARE
  v_action text;
BEGIN
  v_action := CASE WHEN TG_OP = 'INSERT' THEN 'BILLING_PLAN_CREATED'
                   WHEN OLD.monthly_price IS DISTINCT FROM NEW.monthly_price
                     OR OLD.features IS DISTINCT FROM NEW.features
                     OR OLD.included_users IS DISTINCT FROM NEW.included_users
                     OR OLD.included_branches IS DISTINCT FROM NEW.included_branches
                     OR OLD.included_storage_mb IS DISTINCT FROM NEW.included_storage_mb
                     OR OLD.included_transactions IS DISTINCT FROM NEW.included_transactions
                     OR OLD.trial_days IS DISTINCT FROM NEW.trial_days
                     OR OLD.description IS DISTINCT FROM NEW.description
                     OR OLD.status IS DISTINCT FROM NEW.status
                     OR OLD.sort_order IS DISTINCT FROM NEW.sort_order
                     OR OLD.badge IS DISTINCT FROM NEW.badge
                     OR OLD.plan_category IS DISTINCT FROM NEW.plan_category
                     OR OLD.visual_theme IS DISTINCT FROM NEW.visual_theme
                   THEN 'BILLING_PLAN_UPDATED'
                   ELSE NULL END;
  IF v_action IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.billing_plan_audit_log(plan_id, company_id, action, changed_by, previous_values, new_values)
  VALUES (
    NEW.id, NEW.company_id, v_action, auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billing_plan_audit_change ON public.billing_plans;
CREATE TRIGGER billing_plan_audit_change
AFTER INSERT OR UPDATE ON public.billing_plans
FOR EACH ROW EXECUTE FUNCTION public.billing_audit_plan_change();

-- The six official, globally available monthly packages. This intentionally establishes
-- the approved launch pricing; later edits are explicit, audited database changes.
INSERT INTO public.billing_plans (
  company_id, code, name, description, status, currency, monthly_price, annual_price,
  included_users, included_branches, included_storage_mb, included_transactions,
  features, module_entitlements, sort_order, recommended, plan_category, badge, visual_theme, trial_days
) VALUES
  (NULL, 'TWIGA', 'TWIGA', 'Starter business package for essential daily operations.', 'Active', 'TZS', 5000, NULL, 3, 1, 512, 300,
   '{"coreOperations": true, "basicReports": true, "support": true}'::jsonb, '["finance","sales","inventory","hr"]'::jsonb, 10, false, 'Business', 'Starter', 'twiga', 30),
  (NULL, 'TEMBO', 'TEMBO', 'Business package with broader operating visibility and controls.', 'Active', 'TZS', 10000, NULL, 10, 3, 2048, 2000,
   '{"coreOperations": true, "advancedReports": true, "approvals": true, "support": true}'::jsonb, '["finance","sales","inventory","hr","procurement","reports"]'::jsonb, 20, true, 'Business', 'Popular', 'tembo', 30),
  (NULL, 'SIMBA', 'SIMBA', 'Professional package for growing organizations with advanced operational needs.', 'Active', 'TZS', 15000, NULL, 30, 10, 8192, 10000,
   '{"coreOperations": true, "advancedReports": true, "approvals": true, "prioritySupport": true, "multiBranch": true}'::jsonb, '["finance","sales","inventory","hr","procurement","reports","pos","hospitality"]'::jsonb, 30, false, 'Business', 'Professional', 'simba', 30),
  (NULL, 'SIMBA_SC', 'SIMBA SC SPECIAL', 'Football Fans Special package with a Simba-inspired abstract theme.', 'Active', 'TZS', 4500, NULL, 3, 1, 512, 300,
   '{"coreOperations": true, "basicReports": true, "support": true}'::jsonb, '["finance","sales","inventory","hr"]'::jsonb, 110, false, 'Football', 'SIMBA SC SPECIAL', 'simba-sc', 30),
  (NULL, 'YANGA_SC', 'YANGA SC SPECIAL', 'Football Fans Special package with a Yanga-inspired abstract theme.', 'Active', 'TZS', 9000, NULL, 10, 3, 2048, 2000,
   '{"coreOperations": true, "advancedReports": true, "approvals": true, "support": true}'::jsonb, '["finance","sales","inventory","hr","procurement","reports"]'::jsonb, 120, false, 'Football', 'YANGA SC SPECIAL', 'yanga-sc', 30),
  (NULL, 'AZAM_FC', 'AZAM FC SPECIAL', 'Football Fans Special package with an Azam-inspired abstract theme.', 'Active', 'TZS', 7000, NULL, 6, 2, 1024, 1000,
   '{"coreOperations": true, "basicReports": true, "approvals": true, "support": true}'::jsonb, '["finance","sales","inventory","hr","procurement"]'::jsonb, 130, false, 'Football', 'AZAM FC SPECIAL', 'azam-fc', 30)
ON CONFLICT ON CONSTRAINT billing_plans_scope_code_unique DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  currency = EXCLUDED.currency,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  included_users = EXCLUDED.included_users,
  included_branches = EXCLUDED.included_branches,
  included_storage_mb = EXCLUDED.included_storage_mb,
  included_transactions = EXCLUDED.included_transactions,
  features = EXCLUDED.features,
  module_entitlements = EXCLUDED.module_entitlements,
  sort_order = EXCLUDED.sort_order,
  recommended = EXCLUDED.recommended,
  plan_category = EXCLUDED.plan_category,
  badge = EXCLUDED.badge,
  visual_theme = EXCLUDED.visual_theme,
  trial_days = EXCLUDED.trial_days,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.billing_public_plan_catalog()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'code', p.code,
    'name', p.name,
    'description', p.description,
    'currency', p.currency,
    'monthlyPrice', p.monthly_price,
    'trialDays', p.trial_days,
    'category', p.plan_category,
    'badge', p.badge,
    'visualTheme', p.visual_theme,
    'features', p.features,
    'limits', jsonb_build_object('users', p.included_users, 'branches', p.included_branches, 'storageMb', p.included_storage_mb, 'transactions', p.included_transactions)
  ) ORDER BY p.sort_order, p.name), '[]'::jsonb)
  FROM public.billing_plans p
  WHERE p.company_id IS NULL AND p.status = 'Active';
$$;

CREATE OR REPLACE FUNCTION public.billing_start_trial(p_plan_code text DEFAULT 'TWIGA')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_company_id uuid := public.current_company_id();
  v_plan public.billing_plans%ROWTYPE;
  v_subscription public.tenant_subscriptions%ROWTYPE;
  v_plan_code text := upper(trim(coalesce(p_plan_code, 'TWIGA')));
  v_started_at timestamptz := now();
  v_ends_at timestamptz;
BEGIN
  PERFORM public.billing_require_manager();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'A current workspace company is required to start a trial.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_plan
  FROM public.billing_plans
  WHERE company_id IS NULL AND status = 'Active' AND code = v_plan_code;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected official package is not available.' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (SELECT 1 FROM public.tenant_subscriptions WHERE company_id = v_company_id AND trial_started_at IS NOT NULL) THEN
    SELECT * INTO v_subscription FROM public.tenant_subscriptions
    WHERE company_id = v_company_id AND trial_started_at IS NOT NULL
    ORDER BY trial_started_at DESC LIMIT 1;
    RETURN jsonb_build_object('subscription', to_jsonb(v_subscription), 'created', false, 'reason', 'trial_already_granted');
  END IF;
  v_ends_at := v_started_at + make_interval(days => v_plan.trial_days);
  INSERT INTO public.tenant_subscriptions(
    company_id, plan_id, status, billing_cycle, amount, currency, started_at, expires_at,
    trial_started_at, trial_ends_at, metadata
  ) VALUES (
    v_company_id, v_plan.id, 'Trial', 'Monthly', 0, v_plan.currency, v_started_at, v_ends_at,
    v_started_at, v_ends_at,
    jsonb_build_object('trial', true, 'selectedPlanCode', v_plan.code, 'trialDays', v_plan.trial_days)
  ) RETURNING * INTO v_subscription;
  INSERT INTO public.subscription_notifications(company_id, subscription_id, notification_key, title, message, metadata)
  VALUES (
    v_company_id, v_subscription.id, 'TRIAL_STARTED', '30-Day Free Trial activated',
    format('Karibu SMART MANAGER. Anza na siku %s BURE. Trial yako inaisha %s.', v_plan.trial_days, to_char(v_ends_at AT TIME ZONE 'Africa/Dar_es_Salaam', 'DD Mon YYYY')),
    jsonb_build_object('planCode', v_plan.code, 'trialEndsAt', v_ends_at)
  );
  PERFORM public.billing_audit('SUBSCRIPTION_TRIAL_STARTED', v_plan.code, v_subscription.id, NULL, NULL, 'Trial', jsonb_build_object('trialStartedAt', v_started_at, 'trialEndsAt', v_ends_at, 'planCode', v_plan.code));
  RETURN jsonb_build_object('subscription', to_jsonb(v_subscription), 'created', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_select_trial_plan(p_plan_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_plan public.billing_plans%ROWTYPE;
  v_subscription public.tenant_subscriptions%ROWTYPE;
  v_previous_plan_id uuid;
BEGIN
  PERFORM public.billing_require_manager();
  SELECT * INTO v_plan FROM public.billing_plans
  WHERE company_id IS NULL AND status = 'Active' AND code = upper(trim(coalesce(p_plan_code, '')));
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected official package is not available.' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_subscription FROM public.tenant_subscriptions
  WHERE company_id = public.current_company_id() AND status = 'Trial' AND trial_ends_at > now()
  ORDER BY trial_started_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'An active free trial is required to change the selected package.' USING ERRCODE = 'P0002'; END IF;
  v_previous_plan_id := v_subscription.plan_id;
  UPDATE public.tenant_subscriptions
  SET plan_id = v_plan.id,
      metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{selectedPlanCode}', to_jsonb(v_plan.code), true)
  WHERE id = v_subscription.id
  RETURNING * INTO v_subscription;
  PERFORM public.billing_audit('SUBSCRIPTION_TRIAL_PLAN_SELECTED', v_plan.code, v_subscription.id, NULL, 'Trial', 'Trial', jsonb_build_object('previousPlanId', v_previous_plan_id, 'planId', v_plan.id));
  RETURN to_jsonb(v_subscription);
END;
$$;

CREATE OR REPLACE FUNCTION public.billing_reconcile_trial_expiry(p_company_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_subscription public.tenant_subscriptions%ROWTYPE;
  v_company uuid;
  v_days_remaining integer;
  v_key text;
  v_title text;
  v_message text;
  v_processed integer := 0;
  v_expired integer := 0;
  v_notified integer := 0;
BEGIN
  FOR v_subscription IN
    SELECT * FROM public.tenant_subscriptions
    WHERE status = 'Trial'
      AND trial_started_at IS NOT NULL
      AND (p_company_id IS NULL OR company_id = p_company_id)
    FOR UPDATE
  LOOP
    v_company := v_subscription.company_id;
    IF v_subscription.trial_ends_at <= now() THEN
      UPDATE public.tenant_subscriptions
      SET status = 'Expired', expires_at = v_subscription.trial_ends_at,
          metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{trialExpiredAt}', to_jsonb(now()), true)
      WHERE id = v_subscription.id;
      INSERT INTO public.subscription_notifications(company_id, subscription_id, notification_key, title, message, metadata)
      VALUES (
        v_company, v_subscription.id, 'TRIAL_EXPIRED', 'Trial yako imekwisha',
        'Trial yako imekwisha. Chagua kifurushi kuendelea kutumia huduma za premium. Data ya kampuni yako imehifadhiwa.',
        jsonb_build_object('trialEndsAt', v_subscription.trial_ends_at)
      ) ON CONFLICT (company_id, notification_key) DO NOTHING;
      PERFORM public.billing_audit('SUBSCRIPTION_TRIAL_EXPIRED', 'trial-expired', v_subscription.id, NULL, 'Trial', 'Expired', jsonb_build_object('trialEndsAt', v_subscription.trial_ends_at));
      v_expired := v_expired + 1;
    ELSE
      v_days_remaining := greatest(0, ceil(extract(epoch FROM (v_subscription.trial_ends_at - now())) / 86400.0)::integer);
      IF v_days_remaining IN (7, 3, 1) THEN
        v_key := format('TRIAL_WARNING_%s_DAYS', v_days_remaining);
        v_title := format('Trial yako inaisha baada ya siku %s', v_days_remaining);
        v_message := format('Trial yako inaisha baada ya siku %s. Chagua kifurushi chako mapema; hakuna malipo ya moja kwa moja yatakayofanyika.', v_days_remaining);
        INSERT INTO public.subscription_notifications(company_id, subscription_id, notification_key, title, message, metadata)
        VALUES (v_company, v_subscription.id, v_key, v_title, v_message, jsonb_build_object('daysRemaining', v_days_remaining, 'trialEndsAt', v_subscription.trial_ends_at))
        ON CONFLICT (company_id, notification_key) DO NOTHING;
        IF FOUND THEN v_notified := v_notified + 1; END IF;
      END IF;
    END IF;
    v_processed := v_processed + 1;
  END LOOP;
  RETURN jsonb_build_object('processed', v_processed, 'expired', v_expired, 'notificationsCreated', v_notified);
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
    'plans', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.plan_category, p.sort_order, p.name) FROM public.billing_plans p WHERE p.company_id IS NULL OR p.company_id = v_company_id), '[]'::jsonb),
    'subscription', coalesce((SELECT to_jsonb(s) FROM public.tenant_subscriptions s WHERE s.company_id = v_company_id AND s.status IN ('Trial', 'Pending', 'Active', 'Grace', 'Expired') ORDER BY s.created_at DESC LIMIT 1), '{}'::jsonb),
    'notifications', coalesce((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC) FROM (SELECT * FROM public.subscription_notifications WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 50) n), '[]'::jsonb),
    'payments', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM (SELECT * FROM public.subscription_payments WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) p), '[]'::jsonb),
    'invoices', coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.issued_at DESC) FROM (SELECT * FROM public.subscription_invoices WHERE company_id = v_company_id ORDER BY issued_at DESC LIMIT 100) i), '[]'::jsonb),
    'events', coalesce((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC) FROM (SELECT * FROM public.subscription_events WHERE company_id = v_company_id ORDER BY created_at DESC LIMIT 100) e), '[]'::jsonb)
  );
END;
$$;

ALTER TABLE public.billing_plan_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subscription_notifications_read ON public.subscription_notifications;
CREATE POLICY subscription_notifications_read ON public.subscription_notifications FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.billing_is_manager());

DROP POLICY IF EXISTS billing_plan_audit_log_read ON public.billing_plan_audit_log;
CREATE POLICY billing_plan_audit_log_read ON public.billing_plan_audit_log FOR SELECT TO authenticated
USING (company_id = public.current_company_id() AND public.billing_is_manager());

REVOKE ALL ON FUNCTION public.billing_public_plan_catalog() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_start_trial(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_select_trial_plan(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_reconcile_trial_expiry(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.billing_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.billing_public_plan_catalog() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.billing_start_trial(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_select_trial_plan(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.billing_reconcile_trial_expiry(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.billing_snapshot() TO authenticated;

COMMIT;
