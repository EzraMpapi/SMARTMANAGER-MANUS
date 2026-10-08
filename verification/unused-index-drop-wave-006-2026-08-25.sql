-- SMART MANAGER — gated unused-index removal review script
-- Snapshot: 25 August 2026, live Performance Advisor
--
-- This is NOT an automatic cleanup script. It aborts unless the operator
-- explicitly passes `-v confirm_unused_index_drop=on` to psql after completing
-- the workload, staging, business-owner, and rollback gates in the companion
-- report. Do not run this through the Supabase migration connector.
--
-- Current snapshot: 372 unused-index observations. The seven targets below
-- are only conditional candidates: each was valid, non-unique, non-primary,
-- non-constraint-backed, non-partial, zero-scan, on an empty estimated table,
-- and had no broader same-prefix sibling at review time. None is approved for
-- production removal by this file alone.
--
-- Protected findings deliberately excluded from this script include all
-- FK-leading indexes, all indexes on non-empty tables, all partial indexes,
-- all constraint-backed/unique/primary indexes, all broader-prefix cases, and
-- all indexes used by financial, audit, webhook, subscription, tenant, or
-- business-critical workflows until workload evidence is complete.

\set ON_ERROR_STOP on
\if :{?confirm_unused_index_drop}
  \if :confirm_unused_index_drop
    \echo 'Explicit confirmation supplied; running runtime safety gates.'
  \else
    \echo 'ABORTED: pass -v confirm_unused_index_drop=on only after review.'
    \quit 2
  \endif
\else
  \echo 'ABORTED: review-only by default. Pass -v confirm_unused_index_drop=on only after approval.'
  \quit 2
\endif

-- Abort if any target changed since the review snapshot. The expected index
-- definition is part of the safety fence, not documentation only.
DO $$
DECLARE
  v_bad text;
BEGIN
  WITH expected(index_name, expected_definition) AS (
    VALUES
      ('bank_provider_webhook_drain_approvals_scope_idx', 'CREATE INDEX bank_provider_webhook_drain_approvals_scope_idx ON public.bank_provider_webhook_drain_approvals USING btree (provider, provider_account_key, status, expires_at)'),
      ('billing_plans_catalog_idx', 'CREATE INDEX billing_plans_catalog_idx ON public.billing_plans USING btree (plan_category, status, sort_order, code)'),
      ('hc_insurance_claims_company_status_idx', 'CREATE INDEX hc_insurance_claims_company_status_idx ON public.hc_insurance_claims USING btree (company_id, status)'),
      ('hc_notifications_company_status_idx', 'CREATE INDEX hc_notifications_company_status_idx ON public.hc_notifications USING btree (company_id, status)'),
      ('platform_admin_actions_actor_idx', 'CREATE INDEX platform_admin_actions_actor_idx ON public.platform_admin_actions USING btree (actor_user_id, created_at DESC)'),
      ('platform_admin_actions_target_idx', 'CREATE INDEX platform_admin_actions_target_idx ON public.platform_admin_actions USING btree (target_type, target_id, created_at DESC)'),
      ('subscription_payments_provider_order_idx', 'CREATE INDEX subscription_payments_provider_order_idx ON public.subscription_payments USING btree (provider, provider_order_id)')
  ), observed AS (
    SELECT e.index_name,
           e.expected_definition,
           ui.indexrelid,
           ui.idx_scan,
           pg_get_indexdef(ui.indexrelid) AS actual_definition,
           i.indisvalid,
           i.indisunique,
           i.indisprimary,
           (i.indpred IS NOT NULL) AS is_partial,
           EXISTS (SELECT 1 FROM pg_constraint con WHERE con.conindid = ui.indexrelid) AS is_constraint_backed,
           COALESCE(c.reltuples, 0)::bigint AS estimated_rows,
           EXISTS (
             SELECT 1
             FROM pg_index j
             WHERE j.indexrelid <> i.indexrelid
               AND j.indrelid = i.indrelid
               AND j.indisvalid
               AND j.indnkeyatts > i.indnkeyatts
               AND j.indkey[0:i.indnkeyatts-1]::int[] = i.indkey[0:i.indnkeyatts-1]::int[]
               AND j.indpred IS NOT DISTINCT FROM i.indpred
               AND j.indexprs IS NOT DISTINCT FROM i.indexprs
           ) AS has_broader_prefix
    FROM expected e
    LEFT JOIN pg_stat_user_indexes ui
      ON ui.schemaname = 'public' AND ui.indexrelname = e.index_name
    LEFT JOIN pg_index i ON i.indexrelid = ui.indexrelid
    LEFT JOIN pg_class c ON c.oid = ui.relid
  ), bad AS (
    SELECT index_name
    FROM observed
    WHERE indexrelid IS NULL
       OR idx_scan <> 0
       OR actual_definition <> expected_definition
       OR NOT indisvalid
       OR indisunique
       OR indisprimary
       OR is_partial
       OR is_constraint_backed
       OR estimated_rows > 0
       OR has_broader_prefix
  )
  SELECT string_agg(index_name, ', ' ORDER BY index_name) INTO v_bad FROM bad;

  IF v_bad IS NOT NULL THEN
    RAISE EXCEPTION 'ABORTED: unused-index safety gates failed for %', v_bad;
  END IF;
END
$$;

-- Each drop is concurrent to avoid taking a long blocking table lock. These
-- statements are intentionally outside an explicit transaction.
DROP INDEX CONCURRENTLY IF EXISTS public.bank_provider_webhook_drain_approvals_scope_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.billing_plans_catalog_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.hc_insurance_claims_company_status_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.hc_notifications_company_status_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.platform_admin_actions_actor_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.platform_admin_actions_target_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.subscription_payments_provider_order_idx;

\echo 'Completed only after all runtime gates passed. Re-run Performance Advisor and workload smoke tests.'
