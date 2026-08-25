#!/usr/bin/env bash
# Read-only SMART MANAGER database and repository health verification.
# Requires a least-privilege connection URL in SUPABASE_SCHEMA_HEALTH_DATABASE_URL.
# This script executes SELECT statements only and requests a read-only PostgreSQL session.

set -euo pipefail

if [[ -z "${SUPABASE_SCHEMA_HEALTH_DATABASE_URL:-}" ]]; then
  echo "BLOCKED: SUPABASE_SCHEMA_HEALTH_DATABASE_URL is not configured." >&2
  exit 64
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "BLOCKED: PostgreSQL client (psql) is required." >&2
  exit 69
fi

export PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=30000"

health_json="$(psql --no-psqlrc --set=ON_ERROR_STOP=1 --tuples-only --no-align "$SUPABASE_SCHEMA_HEALTH_DATABASE_URL" <<'SQL'
WITH property_tables AS (
  SELECT c.relname, c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname LIKE 'property\_%' ESCAPE '\'
), property_policy_counts AS (
  SELECT tablename, count(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename LIKE 'property\_%' ESCAPE '\'
  GROUP BY tablename
), fixed_deposit_indexes AS (
  SELECT count(*) AS count
  FROM pg_indexes
  WHERE schemaname = 'public' AND indexname IN (
    'bank_fixed_deposit_products_company_code_idx',
    'bank_fixed_deposits_company_deposit_number_idx',
    'bank_fixed_deposits_company_idempotency_idx',
    'bank_fixed_deposit_events_company_idempotency_idx',
    'bank_fixed_deposit_products_company_status_idx',
    'bank_fixed_deposits_company_status_maturity_idx',
    'bank_fixed_deposits_company_customer_idx',
    'bank_fixed_deposits_company_source_account_idx',
    'bank_fixed_deposit_events_company_deposit_time_idx',
    'bank_fixed_deposits_product_fk_idx',
    'bank_fixed_deposits_customer_fk_idx',
    'bank_fixed_deposits_source_account_fk_idx',
    'bank_fixed_deposits_payout_account_fk_idx',
    'bank_fixed_deposit_events_fixed_deposit_fk_idx',
    'bank_fixed_deposit_events_journal_batch_fk_idx',
    'bank_fixed_deposit_events_transaction_fk_idx'
  )
), fixed_deposit_policies AS (
  SELECT count(*) AS count
  FROM pg_policies
  WHERE schemaname = 'public' AND policyname IN (
    'bank_fixed_deposit_products_tenant_select',
    'bank_fixed_deposit_products_tenant_write',
    'bank_fixed_deposit_events_tenant_select',
    'bank_fixed_deposit_events_tenant_insert'
  )
)
SELECT json_build_object(
  'read_only', current_setting('transaction_read_only'),
  'property_tables', (SELECT count(*) FROM property_tables),
  'property_rls_enabled', (SELECT count(*) FROM property_tables WHERE relrowsecurity),
  'property_policy_covered', (
    SELECT count(*) FROM property_tables p
    LEFT JOIN property_policy_counts pc ON pc.tablename = p.relname
    WHERE coalesce(pc.policy_count, 0) > 0
  ),
  'fixed_deposit_tables', (
    SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND c.relname IN ('bank_fixed_deposit_products', 'bank_fixed_deposit_events')
  ),
  'fixed_deposit_indexes', (SELECT count FROM fixed_deposit_indexes),
  'fixed_deposit_policies', (SELECT count FROM fixed_deposit_policies),
  'fixed_deposit_immutable_trigger', (
    SELECT count(*) FROM pg_trigger
    WHERE tgrelid = 'public.bank_fixed_deposit_events'::regclass
      AND tgname = 'bank_fixed_deposit_events_no_update' AND NOT tgisinternal
  ),
  'fixed_deposit_immutable_function', (
    SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'bank_fixed_deposit_events_immutable'
  ),
  'migration_ledger_entries', (SELECT count(*) FROM supabase_migrations.schema_migrations)
);
SQL
)"

if ! printf '%s' "$health_json" | jq -e . >/dev/null; then
  echo "BLOCKED: database health query returned invalid JSON." >&2
  exit 65
fi

printf '%s\n' "$health_json" | jq .

printf '%s' "$health_json" | jq -e '
  .read_only == "on" and
  .property_tables == 37 and
  .property_rls_enabled == 37 and
  .property_policy_covered == 37 and
  .fixed_deposit_tables == 2 and
  .fixed_deposit_indexes == 16 and
  .fixed_deposit_policies == 4 and
  .fixed_deposit_immutable_trigger == 1 and
  .fixed_deposit_immutable_function == 1 and
  .migration_ledger_entries > 0
' >/dev/null

echo "PASS: read-only Supabase schema health baseline is intact." >&2
