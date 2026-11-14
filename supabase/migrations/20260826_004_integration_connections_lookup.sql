-- Integration Hub lookup support
-- Additive and safe: no table, data, RLS, policy, or grant changes.
-- The UI persists feature-specific configuration inside the existing data JSONB envelope.

CREATE INDEX IF NOT EXISTS integration_connections_company_name_idx
  ON public.integration_connections (company_id, name);
