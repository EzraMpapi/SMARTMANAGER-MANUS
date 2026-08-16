-- Persist personal enterprise table preferences without trusting browser tenant identifiers.
CREATE TABLE IF NOT EXISTS public.user_table_preferences (
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key text NOT NULL CHECK (preference_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  value jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, user_id, preference_key)
);

ALTER TABLE public.user_table_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_table_preferences_select_own ON public.user_table_preferences;
CREATE POLICY user_table_preferences_select_own
  ON public.user_table_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND company_id = public.current_company_id());

DROP POLICY IF EXISTS user_table_preferences_insert_own ON public.user_table_preferences;
CREATE POLICY user_table_preferences_insert_own
  ON public.user_table_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id = public.current_company_id());

DROP POLICY IF EXISTS user_table_preferences_update_own ON public.user_table_preferences;
CREATE POLICY user_table_preferences_update_own
  ON public.user_table_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND company_id = public.current_company_id())
  WITH CHECK (user_id = auth.uid() AND company_id = public.current_company_id());

REVOKE ALL ON TABLE public.user_table_preferences FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_table_preferences TO authenticated;
