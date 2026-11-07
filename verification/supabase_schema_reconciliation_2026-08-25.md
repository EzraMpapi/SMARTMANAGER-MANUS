# Supabase Schema Reconciliation — 2026-08-25

## Scope and baseline

This reconciliation compared the current GitHub `main` source archive at commit `ff6d207` with the active SMART MANAGER Supabase project `rlhngsrihahhyxnjxrxm`. The objective was to identify source-declared database objects absent from production and to apply only verified, additive changes. The review did not delete records, tables, policies, functions, or constraints.

| Check | Result |
|---|---:|
| Live public tables inspected | 535 |
| Source-declared tables compared | 302 |
| Source-declared tables missing from production | 0 |
| Live public tables with RLS enabled | 535 |
| Applied migrations before this reconciliation | 166 |
| New migration applied | `bank_provider_webhook_fk_indexes_20260825` |
| New migration registry version | `20260825205952` |

## Applied additive remediation

The live performance advisor identified eight uncovered foreign keys on the recently introduced bank-provider webhook control-plane tables. The source-controlled migration `supabase/migrations/20260825_021_bank_provider_webhook_fk_indexes.sql` adds eight `CREATE INDEX IF NOT EXISTS` statements. The migration is idempotent and changes no records, RLS policies, grants, functions, or constraints.

| Table | Added index coverage |
|---|---|
| `bank_provider_transactions` | `(company_id, payment_instruction_id)` |
| `bank_provider_webhook_drain_approvals` | `approved_by`; `requested_by` |
| `bank_provider_webhook_drain_runs` | `requested_by` |
| `bank_provider_webhook_events` | `(company_id, payment_instruction_id)`; `(company_id, standing_order_run_id)` |
| `bank_provider_webhook_processing` | `(company_id, event_id)` |
| `bank_provider_webhook_remediation` | `(company_id, event_id)` |

The live Supabase migration completed successfully, all eight expected index names were confirmed through `pg_indexes`, and the refreshed performance advisor no longer reported bank-provider unindexed-foreign-key findings.

## Validation

TypeScript validation completed successfully. The complete Vitest suite completed with **236 test files passed**, **981 tests passed**, and **7 test files / 15 tests skipped** because they require externally supplied credentials or live-service approval. The Vite production client build and production server bundle both completed successfully.

The ordinary `pnpm build` wrapper was not executed because its `prebuild` command intentionally invokes a credential-gated remote Supabase schema verifier. The direct client and server production bundle commands passed; no source change in this reconciliation requires the unavailable private runtime credential.

## Existing advisories intentionally not changed

The Supabase security advisor continues to report pre-existing findings outside this table/index reconciliation: six RLS-enabled internal tables without policies, six legacy anonymous `SECURITY DEFINER` functions, and 126 authenticated `SECURITY DEFINER` functions. RLS without a policy is deny-by-default, and the function findings require feature-owner review before grants or behavior can be altered. These were not changed because a blanket revoke could disrupt active banking, booking, or administration workflows.

> The database contains all source-declared tables. This reconciliation added only the eight verified missing foreign-key indexes; it did not create speculative tables or alter application data.
