-- Dedicated least-privilege login for the GitHub Actions schema-health monitor.
-- The password is intentionally not stored in source control; it is set separately
-- and saved only as the SUPABASE_SCHEMA_HEALTH_DATABASE_URL repository secret.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sm_schema_health') THEN
    CREATE ROLE sm_schema_health
      LOGIN
      NOINHERIT
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      PASSWORD NULL;
  END IF;
END
$$;

ALTER ROLE sm_schema_health
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  NOINHERIT;

-- No application-data, write, schema-change, sequence, or function-execution access.
REVOKE ALL PRIVILEGES ON DATABASE postgres FROM sm_schema_health;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM sm_schema_health;
REVOKE ALL PRIVILEGES ON SCHEMA supabase_migrations FROM sm_schema_health;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM sm_schema_health;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM sm_schema_health;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM sm_schema_health;

-- Only the catalog visibility and migration ledger read access used by
-- scripts/verify-schema-health.sh are granted.
GRANT CONNECT ON DATABASE postgres TO sm_schema_health;
GRANT USAGE ON SCHEMA public, supabase_migrations TO sm_schema_health;
GRANT SELECT ON TABLE supabase_migrations.schema_migrations TO sm_schema_health;

-- Defense in depth: the workflow itself sets PGOPTIONS as well.
ALTER ROLE sm_schema_health SET default_transaction_read_only = on;
ALTER ROLE sm_schema_health SET statement_timeout = '30s';
ALTER ROLE sm_schema_health SET lock_timeout = '5s';

COMMENT ON ROLE sm_schema_health IS
  'Least-privilege login for credential-free GitHub Actions schema health inspection; metadata and migration ledger only.';
