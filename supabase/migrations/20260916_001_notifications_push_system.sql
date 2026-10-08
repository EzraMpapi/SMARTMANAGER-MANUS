BEGIN;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  message text NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 4000),
  type text NOT NULL DEFAULT 'system' CHECK (length(trim(type)) BETWEEN 1 AND 64),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  notification_key text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_key_unique
  ON public.notifications(user_id, notification_key)
  WHERE notification_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_company_idx
  ON public.notifications(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'web' CHECK (platform IN ('web','android','ios','unknown')),
  device_name text,
  browser text,
  subscription jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_tokens_token_not_blank CHECK (length(trim(token)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS push_tokens_user_token_unique ON public.push_tokens(user_id, token);
CREATE INDEX IF NOT EXISTS push_tokens_active_user_idx ON public.push_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS push_tokens_active_platform_idx ON public.push_tokens(platform, is_active);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  orders boolean NOT NULL DEFAULT true,
  payments boolean NOT NULL DEFAULT true,
  deliveries boolean NOT NULL DEFAULT true,
  promotions boolean NOT NULL DEFAULT true,
  stock_alerts boolean NOT NULL DEFAULT true,
  system boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.notifications, public.push_tokens, public.notification_preferences FROM PUBLIC, anon;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notifications, public.push_tokens, public.notification_preferences TO service_role;

DROP POLICY IF EXISTS notifications_own_read ON public.notifications;
CREATE POLICY notifications_own_read ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND company_id = public.current_company_id());
DROP POLICY IF EXISTS notifications_own_update ON public.notifications;
CREATE POLICY notifications_own_update ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND company_id = public.current_company_id())
  WITH CHECK (user_id = auth.uid() AND company_id = public.current_company_id());
DROP POLICY IF EXISTS notifications_manager_insert ON public.notifications;
CREATE POLICY notifications_manager_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_company_id() AND public.billing_is_manager());

DROP POLICY IF EXISTS push_tokens_own_access ON public.push_tokens;
CREATE POLICY push_tokens_own_access ON public.push_tokens FOR ALL TO authenticated
  USING (user_id = auth.uid() AND company_id = public.current_company_id())
  WITH CHECK (user_id = auth.uid() AND company_id = public.current_company_id());

DROP POLICY IF EXISTS notification_preferences_own_access ON public.notification_preferences;
CREATE POLICY notification_preferences_own_access ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid() AND company_id = public.current_company_id())
  WITH CHECK (user_id = auth.uid() AND company_id = public.current_company_id());

CREATE OR REPLACE FUNCTION public.set_push_token_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public, auth, pg_temp AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER push_tokens_updated_at BEFORE UPDATE ON public.push_tokens
FOR EACH ROW EXECUTE FUNCTION public.set_push_token_updated_at();

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;

-- Edge Functions use service_role and enforce authorization server-side; no private keys belong in this migration.
-- Configure: FCM_SERVICE_ACCOUNT_JSON, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT as Supabase secrets.

DO $$ BEGIN
  EXECUTE 'COMMENT ON TABLE public.notifications IS ''Tenant-scoped in-app and push notification records''';
  EXECUTE 'COMMENT ON TABLE public.push_tokens IS ''Tenant-scoped active device/browser push registrations''';
END $$;

-- Keep the migration transactionally valid if the publication is unavailable in local test databases.
COMMIT;

-- The final COMMIT above intentionally closes the DDL transaction.
-- Supabase migration runners accept the idempotent publication block in hosted projects.

